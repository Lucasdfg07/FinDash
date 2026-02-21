'use client';

import { formatCurrency, formatDate } from '@/lib/utils';

interface Anomaly {
  transactionId: string;
  date: Date;
  description: string;
  amount: number;
  anomalyScore: number;
  reason: string;
  category?: string;
}

interface Props {
  anomalies: Anomaly[];
  onAnomalyClick?: (anomaly: Anomaly) => void;
}

export function AnomalyTimeline({ anomalies, onAnomalyClick }: Props) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3
          className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-4"
          style={{ color: 'var(--muted)' }}
        >
          ANOMALIES DETECTED
        </h3>
        <p className="text-center text-muted py-8">No anomalies detected in this period</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <h3
        className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-6"
        style={{ color: 'var(--muted)' }}
      >
        ANOMALIES DETECTED
      </h3>

      <div className="space-y-4">
        {anomalies.map((anomaly) => {
          const severity = anomaly.anomalyScore > 0.8 ? 'critical' : 'warning';
          const severityColor = severity === 'critical' ? '#ef4444' : '#f59e0b';

          return (
            <div
              key={anomaly.transactionId}
              className="p-3 rounded-lg border"
              style={{
                borderColor: severityColor,
                backgroundColor: `${severityColor}15`,
                cursor: onAnomalyClick ? 'pointer' : 'default',
              }}
              onClick={() => onAnomalyClick?.(anomaly)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded"
                      style={{
                        backgroundColor: severityColor,
                        color: 'white',
                      }}
                    >
                      {severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                      {formatDate(anomaly.date)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold mb-1">{anomaly.description}</p>

                  <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                    {anomaly.reason}
                  </p>
                </div>

                <div className="text-right ml-4">
                  <p className="font-mono font-bold" style={{ color: severityColor }}>
                    {formatCurrency(Math.abs(anomaly.amount))}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                    {Math.round(anomaly.anomalyScore * 100)}% anomaly
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--subtle-bg)' }}>
        <p className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
          💡 Anomalies are transactions that deviate significantly from your normal spending
          patterns. Review them to understand unusual expenses.
        </p>
      </div>
    </div>
  );
}
