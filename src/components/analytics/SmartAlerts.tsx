'use client';

import { useState } from 'react';

interface SmartAlert {
  id: string;
  categoryId: string;
  categoryName: string;
  alertType: 'approaching_budget' | 'unusual_spending' | 'trend_change';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  confidence: number;
  timestamp: Date;
}

interface Props {
  alerts: SmartAlert[];
  onDismiss?: (alertId: string) => void;
}

const getAlertConfig = (alert: SmartAlert) => {
  const configs: Record<string, { icon: string; bgColor: string; textColor: string }> = {
    approaching_budget: {
      icon: '📊',
      bgColor: '#fef3c7',
      textColor: '#92400e',
    },
    unusual_spending: {
      icon: '⚠️',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
    },
    trend_change: {
      icon: '📈',
      bgColor: '#d1fae5',
      textColor: '#065f46',
    },
  };

  const severityOverrides: Record<string, { bgColor: string; textColor: string }> = {
    critical: {
      bgColor: '#fee2e2',
      textColor: '#991b1b',
    },
    warning: {
      bgColor: '#fef3c7',
      textColor: '#92400e',
    },
  };

  const config = configs[alert.alertType];
  if (alert.severity !== 'info') {
    return { ...config, ...severityOverrides[alert.severity] };
  }

  return config;
};

export function SmartAlerts({ alerts, onDismiss }: Props) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3
          className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-4"
          style={{ color: 'var(--muted)' }}
        >
          SMART ALERTS
        </h3>
        <p className="text-center text-muted py-8">No active alerts</p>
      </div>
    );
  }

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3
          className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-4"
          style={{ color: 'var(--muted)' }}
        >
          SMART ALERTS
        </h3>
        <p className="text-center text-muted py-8">All alerts dismissed</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 28 }}>
      <h3
        className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-6"
        style={{ color: 'var(--muted)' }}
      >
        SMART ALERTS ({visibleAlerts.length})
      </h3>

      <div className="space-y-3">
        {visibleAlerts.map((alert) => {
          const config = getAlertConfig(alert);

          return (
            <div
              key={alert.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.textColor,
                borderWidth: '1px',
                opacity: 0.9,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <h4
                        className="font-semibold text-sm"
                        style={{ color: config.textColor }}
                      >
                        {alert.categoryName}
                      </h4>
                      <p className="text-xs" style={{ color: config.textColor, opacity: 0.7 }}>
                        {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mb-2" style={{ color: config.textColor }}>
                    {alert.message}
                  </p>

                  <p className="text-xs font-mono" style={{ color: config.textColor, opacity: 0.7 }}>
                    💡 {alert.suggestedAction}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono" style={{ color: config.textColor, opacity: 0.6 }}>
                      Confidence: {Math.round(alert.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const newDismissed = new Set(dismissedAlerts);
                    newDismissed.add(alert.id);
                    setDismissedAlerts(newDismissed);
                    onDismiss?.(alert.id);
                  }}
                  className="ml-4 text-lg hover:opacity-70 transition-opacity"
                  style={{ color: config.textColor }}
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
