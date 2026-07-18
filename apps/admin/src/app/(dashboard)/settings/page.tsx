'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

/**
 * Product configuration (G6): raw JSON editing per key — credit packs, quiz
 * images, feature flags — without redeploying. Super-admin only, audited.
 */
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  const { data: settings, isError } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => apiFetch<AppSetting[]>('/admin/settings'),
  });

  const saveMutation = useMutation({
    mutationFn: (params: { key: string; value: unknown }) =>
      apiFetch(`/admin/settings/${params.key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: params.value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      setEditingKey(null);
      setJsonError(null);
    },
  });

  function startEditing(setting: AppSetting) {
    setEditingKey(setting.key);
    setDraft(JSON.stringify(setting.value, null, 2));
    setJsonError(null);
  }

  function save(key: string) {
    try {
      const value = JSON.parse(draft) as unknown;
      saveMutation.mutate({ key, value });
    } catch {
      setJsonError('JSON invalide — corrigez la syntaxe avant d’enregistrer.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="eyebrow">Contenu</p>
        <h1 className="masthead mt-1">Configuration</h1>
        <p className="mt-2 text-sm text-ink/60">
          Packs de crédits, images du quiz, feature flags — appliqués sans redéploiement. Chaque
          modification est journalisée.
        </p>
      </header>

      {isError ? (
        <p className="mt-8 rounded-md bg-clay-wash px-4 py-3 text-sm text-clay">
          Impossible de charger la configuration. Vérifiez que l’API est démarrée et que votre
          rôle est super-admin.
        </p>
      ) : null}

      <section className="mt-8 space-y-4">
        {settings?.map((setting) => (
          <article key={setting.key} className="rounded-lg border border-sand bg-white/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-semibold">{setting.key}</h2>
              <span className="text-xs text-ink/40">
                modifié le {new Date(setting.updatedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {editingKey === setting.key ? (
              <div className="mt-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={Math.min(16, draft.split('\n').length + 2)}
                  spellCheck={false}
                  className="w-full rounded-md border border-sand-deep bg-white p-3 font-mono text-xs"
                />
                {jsonError ? <p className="mt-2 text-xs text-clay">{jsonError}</p> : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={saveMutation.isPending}
                    onClick={() => save(setting.key)}
                    className="rounded-md bg-forest px-4 py-1.5 text-xs font-medium text-paper hover:bg-forest-soft disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="rounded-md border border-sand-deep px-4 py-1.5 text-xs text-ink/70"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-start justify-between gap-4">
                <pre className="max-h-40 flex-1 overflow-auto rounded-md bg-paper p-3 font-mono text-xs text-ink/80">
                  {JSON.stringify(setting.value, null, 2)}
                </pre>
                <button
                  type="button"
                  onClick={() => startEditing(setting)}
                  className="rounded-md border border-sand-deep px-4 py-1.5 text-xs font-medium hover:bg-sand/40"
                >
                  Modifier
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-dashed border-sand-deep p-5">
        <h2 className="text-sm font-medium">Nouvelle clé</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="ma-nouvelle-cle (kebab-case)"
            className="flex-1 rounded-md border border-sand-deep bg-white px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            disabled={!/^[a-z0-9-]{2,64}$/.test(newKey)}
            onClick={() => {
              saveMutation.mutate({ key: newKey, value: {} });
              setNewKey('');
            }}
            className="rounded-md bg-forest px-4 py-2 text-xs font-medium text-paper hover:bg-forest-soft disabled:opacity-40"
          >
            Créer
          </button>
        </div>
      </section>
    </div>
  );
}
