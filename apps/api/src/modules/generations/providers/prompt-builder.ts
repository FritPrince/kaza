import type { StructuredPrompt } from '@kaza/shared';

const BUDGET_WORDING: Record<StructuredPrompt['budgetLevel'], string> = {
  low: 'affordable, budget-friendly furniture',
  medium: 'mid-range quality furniture',
  high: 'premium, high-end furniture and finishes',
};

/**
 * Turns the agent's structured prompt into the text prompt shared by every
 * image provider. Geometry preservation is enforced by conditioning (ControlNet
 * depth / image editing), not by the text — but we reinforce it here too (B3).
 */
export function buildInteriorPrompt(prompt: StructuredPrompt): string {
  const palette = prompt.palette.length ? `Color palette: ${prompt.palette.join(', ')}.` : '';
  const keep = prompt.keepElements.length
    ? `Keep unchanged: ${prompt.keepElements.join(', ')}.`
    : '';
  return [
    `Photorealistic interior redesign in ${prompt.style} style.`,
    BUDGET_WORDING[prompt.budgetLevel] + '.',
    palette,
    keep,
    prompt.instructions,
    'Preserve the exact room geometry: walls, windows, doors and proportions identical to the source photo.',
    'Professional interior photography, natural lighting, high detail.',
  ]
    .filter(Boolean)
    .join(' ');
}
