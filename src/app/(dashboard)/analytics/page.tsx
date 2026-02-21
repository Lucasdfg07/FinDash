import { Suspense } from 'react';
import { ForecastChart } from '@/components/analytics/ForecastChart';
import { AnomalyTimeline } from '@/components/analytics/AnomalyTimeline';
import { ComparativeMetrics } from '@/components/analytics/ComparativeMetrics';
import { SmartAlerts } from '@/components/analytics/SmartAlerts';
import { forecastSpending, detectAnomalies, calculateMetrics } from '@/lib/analytics-engine';

function LoadingCard() {
  return (
    <div className="glass-card p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

async function AnalyticsDashboard() {
  try {
    const [forecasts, anomalies, metrics] = await Promise.all([
      forecastSpending(),
      detectAnomalies(),
      calculateMetrics(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date() // Today
      ),
    ]);

    // Process forecast data for chart
    const forecastChartData = forecasts.slice(0, 3).map((f) => ({
      date: f.categoryName.substring(0, 10),
      historical: f.historicalAvg,
      predicted: f.predictedSpending,
      lower: f.confidenceInterval[0],
      upper: f.confidenceInterval[1],
    }));

    // Process anomalies for timeline
    const anomaliesForTimeline = anomalies.slice(0, 5).map((a) => ({
      transactionId: a.transactionId,
      date: new Date(),
      description: `Transaction #${a.transactionId.substring(0, 8)}`,
      amount: a.amount,
      anomalyScore: a.anomalyScore,
      reason: a.reason,
      category: a.categoryId,
    }));

    // Process metrics for comparison
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const metricsThisMonth = await calculateMetrics(
      new Date(now.getFullYear(), now.getMonth(), 1),
      now
    );
    const metricsLastMonth = await calculateMetrics(
      new Date(monthAgo.getFullYear(), monthAgo.getMonth(), 1),
      new Date(monthAgo.getFullYear(), monthAgo.getMonth() + 1, 0)
    );

    const comparativeCategories = (metricsThisMonth.byCategory || [])
      .map((cat: any, idx: number) => ({
        categoryId: idx.toString(),
        name: cat.name,
        currentAmount: cat.amount,
        previousAmount: metricsLastMonth.byCategory?.[idx]?.amount || 0,
        currentPercentage: cat.percentage || 0,
        previousPercentage: metricsLastMonth.byCategory?.[idx]?.percentage || 0,
      }))
      .slice(0, 5);

    // Create mock smart alerts
    const smartAlerts = forecasts
      .filter((f) => f.trend === 'up')
      .slice(0, 2)
      .map((f, idx) => {
        const alertType: 'approaching_budget' | 'trend_change' = idx === 0 ? 'approaching_budget' : 'trend_change';
        const severity: 'warning' | 'info' = idx === 0 ? 'warning' : 'info';

        return {
          id: `alert-${idx}`,
          categoryId: f.categoryId,
          categoryName: f.categoryName,
          alertType,
          severity,
          message:
            idx === 0
              ? `${f.categoryName} spending is approaching your budget. Current trend: UP`
              : `${f.categoryName} shows an upward trend. Consider reviewing your budget.`,
          suggestedAction:
            idx === 0
              ? 'Review your spending and adjust budget if needed'
              : 'Monitor spending in this category',
          confidence: f.confidenceScore,
          timestamp: new Date(),
        };
      });

    return (
      <div className="w-full space-y-6">
        <div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text)' }}
          >
            Advanced Analytics
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Predictive insights, anomaly detection, and spending trends
          </p>
        </div>

        {/* Smart Alerts */}
        <SmartAlerts alerts={smartAlerts} />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forecasts */}
          {forecasts.length > 0 && (
            <ForecastChart
              data={forecastChartData}
              categoryName={forecasts[0]?.categoryName || 'All Categories'}
              title="NEXT 30 DAYS FORECAST"
            />
          )}

          {/* Comparative Metrics */}
          <ComparativeMetrics
            categories={comparativeCategories}
            currentPeriod={`This Month`}
            previousPeriod={`Last Month`}
            currentTotal={metricsThisMonth.totalSpent || 0}
            previousTotal={metricsLastMonth.totalSpent || 0}
          />
        </div>

        {/* Anomaly Timeline - Full Width */}
        {anomalies.length > 0 && (
          <AnomalyTimeline anomalies={anomaliesForTimeline} />
        )}

        {/* Analytics Summary */}
        <div className="glass-card p-6">
          <h3
            className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono mb-4"
            style={{ color: 'var(--muted)' }}
          >
            ANALYTICS SUMMARY
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-mono mb-1" style={{ color: 'var(--muted)' }}>
                Total Spent
              </p>
              <p className="text-lg font-mono font-bold">
                R$ {(metrics.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono mb-1" style={{ color: 'var(--muted)' }}>
                Categories
              </p>
              <p className="text-lg font-mono font-bold">{metrics.byCategory?.length || 0}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono mb-1" style={{ color: 'var(--muted)' }}>
                Transactions
              </p>
              <p className="text-lg font-mono font-bold">{metrics.transactionCount || 0}</p>
            </div>
            <div>
              <p className="text-[11px] font-mono mb-1" style={{ color: 'var(--muted)' }}>
                Anomalies
              </p>
              <p className="text-lg font-mono font-bold text-yellow-500">{anomalies.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading analytics:', error);
    return (
      <div className="glass-card p-6">
        <p className="text-center text-red-500">
          Error loading analytics. Please try again later.
        </p>
      </div>
    );
  }
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
