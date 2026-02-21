/**
 * Analytics Engine
 * Provides spending forecasts, anomaly detection, and insights
 */

import { prisma } from '@/lib/prisma';

export interface SpendingForecast {
  categoryId: string;
  categoryName: string;
  historicalAvg: number;
  trend: 'up' | 'down' | 'stable';
  predictedSpending: number;
  confidenceScore: number;
  confidenceInterval: [min: number, max: number];
}

export interface AnomalyDetected {
  transactionId: string;
  amount: number;
  categoryId: string;
  anomalyScore: number;
  reason: string;
}

/**
 * Calculate spending forecast for next 30 days
 */
export async function forecastSpending(): Promise<SpendingForecast[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get transactions from last 30 days
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: thirtyDaysAgo,
      },
    },
    include: { category: true },
  });

  // Group by category and calculate statistics
  const byCategory = new Map<string, { amounts: number[]; name: string }>();

  recentTransactions.forEach((tx) => {
    const key = tx.categoryId || 'uncategorized';
    if (!byCategory.has(key)) {
      byCategory.set(key, { amounts: [], name: tx.category?.name || 'Other' });
    }
    byCategory.get(key)!.amounts.push(Math.abs(tx.amount));
  });

  // Calculate forecasts
  const forecasts: SpendingForecast[] = [];

  byCategory.forEach((data, categoryId) => {
    const amounts = data.amounts.sort((a, b) => a - b);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length
    );

    // Simple trend detection
    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

    const trend: 'up' | 'down' | 'stable' =
      secondAvg > firstAvg * 1.1 ? 'up' : secondAvg < firstAvg * 0.9 ? 'down' : 'stable';

    forecasts.push({
      categoryId,
      categoryName: data.name,
      historicalAvg: Math.round(avg * 100) / 100,
      trend,
      predictedSpending: Math.round(avg * 1.05 * 100) / 100, // 5% conservative estimate
      confidenceScore: 0.85,
      confidenceInterval: [
        Math.round((avg - stdDev) * 100) / 100,
        Math.round((avg + stdDev) * 100) / 100,
      ],
    });
  });

  return forecasts;
}

/**
 * Detect anomalies in recent spending
 */
export async function detectAnomalies(): Promise<AnomalyDetected[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: thirtyDaysAgo,
      },
    },
    include: { category: true },
  });

  // Calculate Z-scores for each category
  const byCategory = new Map<string, number[]>();

  recentTransactions.forEach((tx) => {
    const key = tx.categoryId || 'uncategorized';
    if (!byCategory.has(key)) {
      byCategory.set(key, []);
    }
    byCategory.get(key)!.push(Math.abs(tx.amount));
  });

  const anomalies: AnomalyDetected[] = [];

  recentTransactions.forEach((tx) => {
    const key = tx.categoryId || 'uncategorized';
    const amounts = byCategory.get(key) || [];

    if (amounts.length < 3) return;

    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length
    );

    const zScore = Math.abs((Math.abs(tx.amount) - avg) / (stdDev || 1));
    const anomalyScore = Math.min(zScore / 3, 1); // Normalize to 0-1

    if (zScore > 2.5) {
      // 2.5 std deviations = outlier
      anomalies.push({
        transactionId: tx.id,
        amount: tx.amount,
        categoryId: tx.categoryId || 'uncategorized',
        anomalyScore,
        reason: `unusual_amount (${Math.round(anomalyScore * 100)}% confidence)`,
      });
    }
  });

  return anomalies;
}

/**
 * Calculate spending metrics for comparison
 */
export async function calculateMetrics(startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { category: true },
  });

  const totalSpent = transactions.reduce((sum, tx) => {
    return tx.amount < 0 ? sum + Math.abs(tx.amount) : sum;
  }, 0);

  const byCategory = new Map<string, { name: string; amount: number }>();

  transactions.forEach((tx) => {
    if (tx.amount < 0) {
      const key = tx.categoryId || 'uncategorized';
      if (!byCategory.has(key)) {
        byCategory.set(key, { name: tx.category?.name || 'Other', amount: 0 });
      }
      const data = byCategory.get(key)!;
      data.amount += Math.abs(tx.amount);
    }
  });

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    byCategory: Array.from(byCategory.values()).map((item) => ({
      ...item,
      percentage: Math.round((item.amount / totalSpent) * 10000) / 100,
    })),
    transactionCount: transactions.length,
  };
}
