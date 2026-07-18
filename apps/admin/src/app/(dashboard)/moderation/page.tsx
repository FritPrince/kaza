'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import type { Paginated } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface ModerationRow {
  id: string;
  imageKey: string;
  imageUrl: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  decision: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
] as const;

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]['value']>('pending');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['moderation', status],
    queryFn: () =>
      apiFetch<Paginated<ModerationRow>>(`/admin/moderation?status=${status}&pageSize=50`),
  });

  const decideMutation = useMutation({
    mutationFn: (params: { itemId: string; action: 'approve' | 'reject'; decision: string }) =>
      apiFetch(`/admin/moderation/${params.itemId}/${params.action}`, {
        method: 'POST',
        body: JSON.stringify({ decision: params.decision }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Contenu</p>
          <h1 className="masthead mt-1">Modération</h1>
        </div>
        <div className="flex rounded-md border border-sand-deep bg-white/60 p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                status === s.value ? 'bg-forest text-paper' : 'text-ink/60 hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      {isError ? (
        <p className="mt-8 rounded-md bg-clay-wash px-4 py-3 text-sm text-clay">
          Impossible de charger la file de modération. Vérifiez que l’API est démarrée.
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink/50">
          {status === 'pending'
            ? 'Aucune image en attente — la file est vide.'
            : 'Aucune image dans cette catégorie.'}
        </p>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-3">
        {isLoading ? <p className="text-sm text-ink/40">Chargement…</p> : null}
        {data?.items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-sand bg-white/60">
            <div className="relative h-44 bg-sand">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink/40">
                  image indisponible
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-ink/60">
                Motif : <span className="font-medium text-ink">{item.reason}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink/40">
                {new Date(item.createdAt).toLocaleString('fr-FR')}
              </p>
              {item.status === 'pending' ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() =>
                      decideMutation.mutate({
                        itemId: item.id,
                        action: 'approve',
                        decision: 'Conforme après revue manuelle',
                      })
                    }
                    className="flex-1 rounded-md bg-forest px-3 py-1.5 text-xs font-medium text-paper hover:bg-forest-soft disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    disabled={decideMutation.isPending}
                    onClick={() =>
                      decideMutation.mutate({
                        itemId: item.id,
                        action: 'reject',
                        decision: 'Contenu non conforme aux CGU',
                      })
                    }
                    className="flex-1 rounded-md bg-clay px-3 py-1.5 text-xs font-medium text-paper hover:bg-clay-soft disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ink/50">{item.decision}</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
