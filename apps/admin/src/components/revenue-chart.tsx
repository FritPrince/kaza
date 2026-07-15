'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface RevenuePoint {
  day: string;
  /** Both series in XOF so the chart keeps a single axis. */
  revenue: number;
  aiCost: number;
}

// Palette validated with the dataviz six-checks validator on surface #F7F2E9:
// #2E8A60 (revenue) / #B4552D (AI cost) — CVD ΔE 18.6, contrast ≥ 3:1.
const REVENUE_COLOR = '#2E8A60';
const AI_COST_COLOR = '#B4552D';
const GRID_COLOR = '#E7DCC8';
const TEXT_COLOR = '#22201C';

const formatXof = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="transparent"
            tick={{ fill: TEXT_COLOR, opacity: 0.55, fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: TEXT_COLOR, opacity: 0.55, fontSize: 11 }}
            tickLine={false}
            tickFormatter={formatXof}
            width={72}
          />
          <Tooltip
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
            contentStyle={{
              background: '#FFFFFF',
              border: `1px solid ${GRID_COLOR}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              `${formatXof(value)} FCFA`,
              name === 'revenue' ? 'Revenus' : 'Coût IA',
            ]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: TEXT_COLOR, fontSize: 12 }}>
                {value === 'revenue' ? 'Revenus' : 'Coût IA'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={REVENUE_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#F7F2E9' }}
          />
          <Line
            type="monotone"
            dataKey="aiCost"
            stroke={AI_COST_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#F7F2E9' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
