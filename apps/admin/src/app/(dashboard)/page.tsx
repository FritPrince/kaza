'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { EconomicsDashboard } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';
import { RevenueChart, type RevenuePoint } from '@/components/revenue-chart';
import { SwatchStat } from '@/components/swatch-stat';
import { cn } from '@/lib/cn';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
] as const;

const formatXof = (value: number): string =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} FCFA`;

// TODO(G2): replace with a real /admin/economics/timeseries endpoint.
const PLACEHOLDER_SERIES: RevenuePoint[] = [
  { day: 'Lun', revenue: 0, aiCost: 0 },
  { day: 'Mar', revenue: 0, aiCost: 0 },
  { day: 'Mer', revenue: 0, aiCost: 0 },
  { day: 'Jeu', revenue: 0, aiCost: 0 },
  { day: 'Ven', revenue: 0, aiCost: 0 },
  { day: 'Sam', revenue: 0, aiCost: 0 },
  { day: 'Dim', revenue: 0, aiCost: 0 },
];

export default function EconomicsPage() {
  const [period, setPeriod] = useState<EconomicsDashboard['period']>('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['economics', period],
    queryFn: () => apiFetch<EconomicsDashboard>(`/admin/economics/dashboard?period=${period}`),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Pilotage</p>
          <h1 className="masthead mt-1">Économie</h1>
        </div>
        <div className="flex rounded-md border border-sand-deep bg-white/60 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                period === p.value ? 'bg-forest text-paper' : 'text-ink/60 hover:text-ink',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {isError ? (
        <p className="mt-8 rounded-md bg-clay-wash px-4 py-3 text-sm text-clay">
          Impossible de charger le tableau de bord. Vérifiez que l’API est démarrée, puis
          rechargez la page.
        </p>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SwatchStat
          reference="K-01"
          tone="forest"
          label="Revenus"
          value={isLoading ? '—' : formatXof(data?.revenue.total ?? 0)}
          detail={`dont Mobile Money ${isLoading ? '—' : formatXof(data?.revenue.mobileMoney ?? 0)}`}
        />
        <SwatchStat
          reference="K-02"
          tone="clay"
          label="Coût IA"
          value={isLoading ? '—' : `$${(data?.aiCosts.totalUsd ?? 0).toFixed(2)}`}
          detail={`${isLoading ? '—' : (data?.aiCosts.perGenerationUsd ?? 0).toFixed(3)} $ / génération`}
        />
        <SwatchStat
          reference="K-03"
          tone="gold"
          label="Marge brute"
          value={isLoading ? '—' : `${data?.grossMarginPercent ?? 0} %`}
          detail="objectif ≥ 70 %"
        />
        <SwatchStat
          reference="K-04"
          tone="sand"
          label="Générations"
          value={isLoading ? '—' : String(data?.generationsCount ?? 0)}
          detail={`${data?.activeUsers ?? 0} utilisateurs actifs`}
        />
      </section>

      <section className="mt-8 rounded-lg border border-sand bg-white/60 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-medium">Revenus vs coût IA</h2>
          <span className="text-xs text-ink/50">en FCFA — série journalière à venir</span>
        </div>
        <div className="mt-4">
          <RevenueChart data={PLACEHOLDER_SERIES} />
        </div>
      </section>
    </div>
  );
}
