'use client';

import { formatCurrency } from '@/lib/utils';

interface CategoryMetric {
  categoryId: string;
  name: string;
  currentAmount: number;
  previousAmount: number;
  currentPercentage: number;
  previousPercentage: number;
}

interface Props {
  categories: CategoryMetric[];
  currentPeriod: string;
  previousPeriod: string;
  currentTotal: number;
  previousTotal: number;
}

export function ComparativeMetrics({
  categories,
  currentPeriod,
  previousPeriod,
  currentTotal,
  previousTotal,
}: Props) {
  const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const isIncrease = totalChange > 0;

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <h3
        className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-6"
        style={{ color: 'var(--muted)' }}
      >
        PERIOD COMPARISON
      </h3>

      {/* Total Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
            {currentPeriod}
          </p>
          <p className="text-lg font-mono font-bold">{formatCurrency(currentTotal)}</p>
        </div>
        <div>
          <p className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
            {previousPeriod}
          </p>
          <p className="text-lg font-mono font-bold">{formatCurrency(previousTotal)}</p>
        </div>
      </div>

      {/* Total Change */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">Overall Change</span>
          <span
            className="text-sm font-mono font-bold"
            style={{ color: isIncrease ? '#ef4444' : '#22c55e' }}
          >
            {isIncrease ? '↑' : '↓'} {Math.abs(totalChange).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2" style={{ backgroundColor: 'var(--subtle-bg)' }}>
          <div
            className="h-2 rounded-full"
            style={{
              width: `${Math.min(Math.abs(totalChange), 100)}%`,
              backgroundColor: isIncrease ? '#ef4444' : '#22c55e',
            }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-semibold" style={{ color: 'var(--muted)' }}>
          BY CATEGORY
        </h4>

        {categories.slice(0, 5).map((cat) => {
          const catChange = cat.previousAmount > 0 ? ((cat.currentAmount - cat.previousAmount) / cat.previousAmount) * 100 : 0;
          const catIsIncrease = catChange > 0;

          return (
            <div key={cat.categoryId} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{cat.name}</span>
                <span
                  className="font-mono"
                  style={{ color: catIsIncrease ? '#ef4444' : '#22c55e' }}
                >
                  {catIsIncrease ? '+' : ''}{catChange.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                  {formatCurrency(cat.currentAmount)}
                </span>
                <div className="flex-1 flex gap-1">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${cat.currentPercentage}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${cat.previousPercentage}%`,
                      backgroundColor: '#6b7280',
                      opacity: 0.5,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length > 5 && (
        <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          +{categories.length - 5} more categories
        </p>
      )}
    </div>
  );
}
