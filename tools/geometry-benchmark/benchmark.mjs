#!/usr/bin/env node
/**
 * Geometry-fidelity benchmark (cahier des charges §12).
 *
 * Feeds real room photos to an image-editing provider with style prompts and
 * produces an HTML report of before/after pairs to score geometry fidelity
 * (walls, windows, doors unchanged — requirement B3).
 *
 * Usage:
 *   node tools/geometry-benchmark/benchmark.mjs [--provider gemini|replicate] [--photos ./photos]
 *        [--styles modern,bohemian] [--model <model>]
 *
 * gemini:    model = generateContent image model (default gemini-2.5-flash-image)
 * replicate: model = owner/name:versionhash (default env REPLICATE_MODEL_VERSION)
 *
 * Reads GEMINI_API_KEY / REPLICATE_API_TOKEN from apps/api/.env (or env). No dependencies.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// --- Config ---------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((arg, i, all) => (arg.startsWith('--') ? [arg.slice(2), all[i + 1]] : [])).filter(Boolean),
);
const PHOTOS_DIR = args.photos ?? path.join(import.meta.dirname, 'photos');
const PROVIDER = args.provider ?? 'gemini';
const OUTPUT_DIR = path.join(import.meta.dirname, 'results', PROVIDER);
const REQUEST_DELAY_MS = 6500; // stay under strict per-minute quotas

const STYLE_PROMPTS = {
  modern:
    'Redecorate this room in a modern, clean style: neutral palette, sleek furniture, minimal decoration.',
  bohemian:
    'Redecorate this room in a warm bohemian style: natural textures, plants, layered rugs, rattan furniture.',
  'afro-contemporary':
    'Redecorate this room in an afro-contemporary style: bold patterns, warm earth tones, artisanal wood furniture, woven textiles.',
};
const styles = args.styles ? args.styles.split(',') : Object.keys(STYLE_PROMPTS);

const GEOMETRY_GUARD =
  ' CRITICAL: preserve the exact room geometry — same walls, same windows, same doors, same proportions and camera angle as the source photo. Photorealistic result.';

// --- Keys -------------------------------------------------------------------
function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.resolve(import.meta.dirname, '../../apps/api/.env');
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function requireEnvVar(name) {
  const value = loadEnvVar(name);
  if (!value) {
    console.error(`${name} not found (env or apps/api/.env)`);
    process.exit(1);
  }
  return value;
}

const MODEL =
  args.model ??
  (PROVIDER === 'replicate'
    ? requireEnvVar('REPLICATE_MODEL_VERSION')
    : (loadEnvVar('GEMINI_IMAGE_MODEL') ?? 'gemini-2.5-flash-image'));
const API_KEY =
  PROVIDER === 'replicate' ? requireEnvVar('REPLICATE_API_TOKEN') : requireEnvVar('GEMINI_API_KEY');

// --- Generation -----------------------------------------------------------
async function editImageGemini(photoBase64, mimeType, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ inlineData: { mimeType, data: photoBase64 } }, { text: prompt + GEOMETRY_GUARD }] },
        ],
      }),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.match(/"message": "([^"]{0,140})/)?.[1] ?? body.slice(0, 140)}`);
  }
  const payload = await response.json();
  const part = (payload.candidates ?? []).flatMap((c) => c.content?.parts ?? []).find((p) => p.inlineData);
  if (!part) throw new Error('No image in response');
  return Buffer.from(part.inlineData.data, 'base64');
}

async function editImageReplicate(photoBase64, mimeType, prompt) {
  const create = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: MODEL.split(':').pop(),
      input: {
        image: `data:${mimeType};base64,${photoBase64}`,
        prompt: prompt + GEOMETRY_GUARD,
        negative_prompt: 'blurry, distorted walls, warped windows, extra doors, low quality, watermark',
      },
    }),
  });
  if (!create.ok) {
    throw new Error(`Replicate create HTTP ${create.status}: ${(await create.text()).slice(0, 140)}`);
  }
  let prediction = await create.json();
  const deadline = Date.now() + 180_000;
  while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
    if (Date.now() > deadline) throw new Error('Replicate timed out');
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    prediction = await poll.json();
  }
  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (prediction.status !== 'succeeded' || !outputUrl) {
    throw new Error(`Replicate ${prediction.status}: ${prediction.error ?? 'no output'}`);
  }
  const image = await fetch(outputUrl);
  return Buffer.from(await image.arrayBuffer());
}

const editImage = PROVIDER === 'replicate' ? editImageReplicate : editImageGemini;

// --- Main -----------------------------------------------------------------
const photos = existsSync(PHOTOS_DIR)
  ? readdirSync(PHOTOS_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f))
  : [];
if (!photos.length) {
  console.error(`No photos found in ${PHOTOS_DIR} — put your 30 room photos there (.jpg/.png).`);
  process.exit(1);
}
mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`Benchmark: ${photos.length} photos x ${styles.length} styles on ${PROVIDER} (${MODEL})`);
const results = [];
for (const photo of photos) {
  const source = readFileSync(path.join(PHOTOS_DIR, photo));
  const mimeType = photo.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  for (const style of styles) {
    const outName = `${path.parse(photo).name}__${style}.jpg`;
    const outPath = path.join(OUTPUT_DIR, outName);
    if (existsSync(outPath)) {
      console.log(`skip (exists) ${outName}`);
      results.push({ photo, style, output: outName, status: 'ok' });
      continue;
    }
    try {
      const started = Date.now();
      const rendered = await editImage(source.toString('base64'), mimeType, STYLE_PROMPTS[style]);
      writeFileSync(outPath, rendered);
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`ok   ${outName} (${seconds}s)`);
      results.push({ photo, style, output: outName, status: 'ok', seconds });
    } catch (error) {
      console.log(`FAIL ${outName} — ${error.message}`);
      results.push({ photo, style, status: 'failed', error: error.message });
    }
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }
}

// --- Report ---------------------------------------------------------------
const rows = results
  .filter((r) => r.status === 'ok')
  .map(
    (r) => `
    <figure data-id="${r.output}">
      <div class="pair">
        <img src="../../photos/${r.photo}" alt="avant" loading="lazy" />
        <img src="${r.output}" alt="après" loading="lazy" />
      </div>
      <figcaption>
        <span>${r.photo} — <strong>${r.style}</strong></span>
        <span class="score">
          Fidélité géométrie :
          ${[1, 2, 3, 4, 5].map((n) => `<button onclick="score('${r.output}',${n})">${n}</button>`).join('')}
          <em id="v-${r.output}"></em>
        </span>
      </figcaption>
    </figure>`,
  )
  .join('\n');

const failures = results.filter((r) => r.status === 'failed');
writeFileSync(
  path.join(OUTPUT_DIR, 'report.html'),
  `<!doctype html><meta charset="utf-8"><title>Kaza — Benchmark géométrie (${PROVIDER})</title>
<style>
  body{font-family:system-ui;margin:2rem;background:#F7F2E9;color:#22201C;max-width:1100px}
  h1{font-size:1.4rem} .pair{display:grid;grid-template-columns:1fr 1fr;gap:4px}
  img{width:100%;border-radius:8px} figure{margin:0 0 2.5rem}
  figcaption{display:flex;justify-content:space-between;padding:.5rem 0;font-size:.9rem}
  button{border:1px solid #D4C5A9;background:#fff;border-radius:6px;padding:2px 10px;cursor:pointer;margin-left:4px}
  .fail{color:#B4552D} em{margin-left:8px;font-style:normal;font-weight:600}
</style>
<h1>Benchmark fidélité géométrique — ${PROVIDER} / ${MODEL} — ${new Date().toISOString().slice(0, 10)}</h1>
<p>Notez chaque paire (1 = géométrie détruite, 5 = murs/fenêtres/portes identiques). Critère §12 : moyenne ≥ 4 pour valider le fournisseur.</p>
<p><button onclick="exportScores()">Exporter les notes (JSON)</button> <span id="avg"></span></p>
${failures.length ? `<p class="fail">${failures.length} échec(s) : ${failures.map((f) => `${f.photo}/${f.style}`).join(', ')}</p>` : ''}
${rows}
<script>
  const KEY='kaza-benchmark-scores-${PROVIDER}';
  const scores=JSON.parse(localStorage.getItem(KEY)??'{}');
  function paint(){for(const [id,n] of Object.entries(scores)){const el=document.getElementById('v-'+id);if(el)el.textContent=n+'/5'}
    const vals=Object.values(scores);document.getElementById('avg').textContent=vals.length?('moyenne : '+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)+' sur '+vals.length+' notes'):''}
  function score(id,n){scores[id]=n;localStorage.setItem(KEY,JSON.stringify(scores));paint()}
  function exportScores(){const blob=new Blob([JSON.stringify({provider:'${PROVIDER}',model:'${MODEL}',scores},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='benchmark-scores-${PROVIDER}.json';a.click()}
  paint();
</script>`,
);

console.log(`\nDone: ${results.filter((r) => r.status === 'ok').length} ok, ${failures.length} failed.`);
console.log(`Report: ${path.join(OUTPUT_DIR, 'report.html')}`);
