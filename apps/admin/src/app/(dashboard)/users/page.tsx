'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Paginated } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/cn';

interface AdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  country: string | null;
  credits: number;
  plan: 'free' | 'premium';
  suspendedAt: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', query, page],
    queryFn: () =>
      apiFetch<Paginated<AdminUserRow>>(
        `/admin/users?page=${page}&pageSize=20${query ? `&q=${encodeURIComponent(query)}` : ''}`,
      ),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="eyebrow">Pilotage</p>
        <h1 className="masthead mt-1">Utilisateurs</h1>
      </header>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <input
          type="search"
          placeholder="Rechercher par e-mail, téléphone ou nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-sand-deep bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-forest-soft"
        >
          Rechercher
        </button>
      </form>

      {isError ? (
        <p className="mt-6 rounded-md bg-clay-wash px-4 py-3 text-sm text-clay">
          Impossible de charger les utilisateurs. Vérifiez que l’API est démarrée.
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-lg border border-sand bg-white/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3 font-medium">Compte</th>
              <th className="px-4 py-3 font-medium">Pays</th>
              <th className="px-4 py-3 font-medium">Crédits</th>
              <th className="px-4 py-3 font-medium">Forfait</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                  Chargement…
                </td>
              </tr>
            ) : data?.items.length ? (
              data.items.map((user) => (
                <tr key={user.id} className="border-b border-sand/60 last:border-0 hover:bg-sand/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.displayName ?? '—'}</p>
                    <p className="font-mono text-xs text-ink/50">{user.email ?? user.phone}</p>
                  </td>
                  <td className="px-4 py-3">{user.country ?? '—'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{user.credits}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        user.plan === 'premium' ? 'bg-gold/20 text-ink' : 'bg-sand text-ink/70',
                      )}
                    >
                      {user.plan === 'premium' ? 'Premium' : 'Gratuit'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.suspendedAt ? (
                      <span className="rounded-full bg-clay-wash px-2 py-0.5 text-xs font-medium text-clay">
                        Suspendu
                      </span>
                    ) : (
                      <span className="text-xs text-ink/50">Actif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/50">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                  Aucun utilisateur ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
        <p>{data ? `${data.total} compte${data.total > 1 ? 's' : ''}` : ''}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-sand-deep px-3 py-1.5 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="py-1.5">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-sand-deep px-3 py-1.5 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
