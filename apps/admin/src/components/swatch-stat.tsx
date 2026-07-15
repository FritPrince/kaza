import { cn } from '@/lib/cn';

interface SwatchStatProps {
  /** Swatch reference, printed like a paint chip number (e.g. "K-01"). */
  reference: string;
  label: string;
  value: string;
  detail?: string;
  tone?: 'clay' | 'forest' | 'gold' | 'sand';
}

const TONE_BAR: Record<NonNullable<SwatchStatProps['tone']>, string> = {
  clay: 'bg-clay',
  forest: 'bg-forest',
  gold: 'bg-gold',
  sand: 'bg-sand-deep',
};

/**
 * KPI as a material sample: a paint-chip color bar, a swatch reference and the
 * value in mono — the signature element of the back-office.
 */
export function SwatchStat({ reference, label, value, detail, tone = 'sand' }: SwatchStatProps) {
  return (
    <div className="rounded-lg border border-sand bg-white/60 p-0.5">
      <div className={cn('h-2 rounded-t-md', TONE_BAR[tone])} />
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs text-ink/60">{label}</p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
            {reference}
          </span>
        </div>
        <p className="mt-2 font-mono text-2xl font-medium tabular-nums">{value}</p>
        {detail ? <p className="mt-1 text-xs text-ink/50">{detail}</p> : null}
      </div>
    </div>
  );
}
