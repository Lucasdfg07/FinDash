/**
 * Analytics Aggregator
 * Time-series data aggregation with hourly/daily/weekly rollups
 * Optimizes analytics queries and enables efficient caching
 */

import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis-pubsub';

export interface MetricsAggregate {
  period: 'hourly' | 'daily' | 'weekly';
  timeStart: Date;
  timeEnd: Date;
  categoryId?: string;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  minTransaction: number;
  maxTransaction: number;
}

export interface AggregationResult {
  period: 'hourly' | 'daily' | 'weekly';
  aggregatesCreated: number;
  cacheHit: boolean;
  executionTimeMs: number;
}

/**
 * Aggregate transactions into hourly buckets
 */
export async function aggregateHourly(): Promise<AggregationResult> {
  const startTime = Date.now();
  const cacheKey = 'analytics:aggregation:hourly:last-run';

  // Check if already run this hour
  let cachedResult = null;
  try {
    const redis = getRedisClient();
    cachedResult = await redis.get(cacheKey);
  } catch {
    // Redis not available
  }
  if (cachedResult) {
    return JSON.parse(cachedResult as string);
  }

  try {
    // Get all transactions from last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: oneDayAgo } },
      include: { category: true },
    });

    // Group by hour and category
    const hourlyData = new Map<string, MetricsAggregate>();

    transactions.forEach((tx) => {
      const hour = new Date(tx.date);
      hour.setMinutes(0, 0, 0);
      const hourKey = `${hour.toISOString()}-${tx.categoryId || 'uncategorized'}`;

      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, {
          period: 'hourly',
          timeStart: hour,
          timeEnd: new Date(hour.getTime() + 3600000),
          categoryId: tx.categoryId || undefined,
          totalSpent: 0,
          transactionCount: 0,
          avgTransaction: 0,
          minTransaction: Infinity,
          maxTransaction: -Infinity,
        });
      }

      const agg = hourlyData.get(hourKey)!;
      const amount = Math.abs(tx.amount);

      agg.totalSpent += amount;
      agg.transactionCount += 1;
      agg.minTransaction = Math.min(agg.minTransaction, amount);
      agg.maxTransaction = Math.max(agg.maxTransaction, amount);
    });

    // Calculate averages
    hourlyData.forEach((agg) => {
      agg.avgTransaction = agg.transactionCount > 0 ? agg.totalSpent / agg.transactionCount : 0;
      if (agg.minTransaction === Infinity) agg.minTransaction = 0;
      if (agg.maxTransaction === -Infinity) agg.maxTransaction = 0;
      // Round to 2 decimal places
      agg.totalSpent = Math.round(agg.totalSpent * 100) / 100;
      agg.avgTransaction = Math.round(agg.avgTransaction * 100) / 100;
      agg.minTransaction = Math.round(agg.minTransaction * 100) / 100;
      agg.maxTransaction = Math.round(agg.maxTransaction * 100) / 100;
    });

    const result: AggregationResult = {
      period: 'hourly',
      aggregatesCreated: hourlyData.size,
      cacheHit: false,
      executionTimeMs: Date.now() - startTime,
    };

    // Cache result for 1 hour
    try {
      const redis = getRedisClient();
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
    } catch {
      // Redis not available
    }

    return result;
  } catch (error) {
    console.error('Error in aggregateHourly:', error);
    throw error;
  }
}

/**
 * Aggregate transactions into daily buckets
 */
export async function aggregateDaily(): Promise<AggregationResult> {
  const startTime = Date.now();
  const cacheKey = 'analytics:aggregation:daily:last-run';

  let cachedResult = null;
  try {
    const redis = getRedisClient();
    cachedResult = await redis.get(cacheKey);
  } catch {
    // Redis not available
  }
  if (cachedResult) {
    return JSON.parse(cachedResult as string);
  }

  try {
    // Get all transactions from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: ninetyDaysAgo } },
      include: { category: true },
    });

    // Group by day and category
    const dailyData = new Map<string, MetricsAggregate>();

    transactions.forEach((tx) => {
      const day = new Date(tx.date);
      day.setHours(0, 0, 0, 0);
      const dayKey = `${day.toISOString()}-${tx.categoryId || 'uncategorized'}`;

      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, {
          period: 'daily',
          timeStart: day,
          timeEnd: new Date(day.getTime() + 86400000),
          categoryId: tx.categoryId || undefined,
          totalSpent: 0,
          transactionCount: 0,
          avgTransaction: 0,
          minTransaction: Infinity,
          maxTransaction: -Infinity,
        });
      }

      const agg = dailyData.get(dayKey)!;
      const amount = Math.abs(tx.amount);

      agg.totalSpent += amount;
      agg.transactionCount += 1;
      agg.minTransaction = Math.min(agg.minTransaction, amount);
      agg.maxTransaction = Math.max(agg.maxTransaction, amount);
    });

    // Calculate averages
    dailyData.forEach((agg) => {
      agg.avgTransaction = agg.transactionCount > 0 ? agg.totalSpent / agg.transactionCount : 0;
      if (agg.minTransaction === Infinity) agg.minTransaction = 0;
      if (agg.maxTransaction === -Infinity) agg.maxTransaction = 0;
      // Round to 2 decimal places
      agg.totalSpent = Math.round(agg.totalSpent * 100) / 100;
      agg.avgTransaction = Math.round(agg.avgTransaction * 100) / 100;
      agg.minTransaction = Math.round(agg.minTransaction * 100) / 100;
      agg.maxTransaction = Math.round(agg.maxTransaction * 100) / 100;
    });

    const result: AggregationResult = {
      period: 'daily',
      aggregatesCreated: dailyData.size,
      cacheHit: false,
      executionTimeMs: Date.now() - startTime,
    };

    // Cache result for 6 hours
    try {
      const redis = getRedisClient();
      await redis.setex(cacheKey, 21600, JSON.stringify(result));
    } catch {
      // Redis not available
    }

    return result;
  } catch (error) {
    console.error('Error in aggregateDaily:', error);
    throw error;
  }
}

/**
 * Aggregate transactions into weekly buckets
 */
export async function aggregateWeekly(): Promise<AggregationResult> {
  const startTime = Date.now();
  const cacheKey = 'analytics:aggregation:weekly:last-run';

  let cachedResult = null;
  try {
    const redis = getRedisClient();
    cachedResult = await redis.get(cacheKey);
  } catch {
    // Redis not available
  }
  if (cachedResult) {
    return JSON.parse(cachedResult as string);
  }

  try {
    // Get all transactions from last 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: oneYearAgo } },
      include: { category: true },
    });

    // Group by week and category
    const weeklyData = new Map<string, MetricsAggregate>();

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);

      const weekKey = `${weekStart.toISOString()}-${tx.categoryId || 'uncategorized'}`;

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          period: 'weekly',
          timeStart: weekStart,
          timeEnd: new Date(weekStart.getTime() + 604800000),
          categoryId: tx.categoryId || undefined,
          totalSpent: 0,
          transactionCount: 0,
          avgTransaction: 0,
          minTransaction: Infinity,
          maxTransaction: -Infinity,
        });
      }

      const agg = weeklyData.get(weekKey)!;
      const amount = Math.abs(tx.amount);

      agg.totalSpent += amount;
      agg.transactionCount += 1;
      agg.minTransaction = Math.min(agg.minTransaction, amount);
      agg.maxTransaction = Math.max(agg.maxTransaction, amount);
    });

    // Calculate averages
    weeklyData.forEach((agg) => {
      agg.avgTransaction = agg.transactionCount > 0 ? agg.totalSpent / agg.transactionCount : 0;
      if (agg.minTransaction === Infinity) agg.minTransaction = 0;
      if (agg.maxTransaction === -Infinity) agg.maxTransaction = 0;
      // Round to 2 decimal places
      agg.totalSpent = Math.round(agg.totalSpent * 100) / 100;
      agg.avgTransaction = Math.round(agg.avgTransaction * 100) / 100;
      agg.minTransaction = Math.round(agg.minTransaction * 100) / 100;
      agg.maxTransaction = Math.round(agg.maxTransaction * 100) / 100;
    });

    const result: AggregationResult = {
      period: 'weekly',
      aggregatesCreated: weeklyData.size,
      cacheHit: false,
      executionTimeMs: Date.now() - startTime,
    };

    // Cache result for 24 hours
    try {
      const redis = getRedisClient();
      await redis.setex(cacheKey, 86400, JSON.stringify(result));
    } catch {
      // Redis not available
    }

    return result;
  } catch (error) {
    console.error('Error in aggregateWeekly:', error);
    throw error;
  }
}

/**
 * Get cached aggregates for a period
 */
export async function getCachedAggregates(period: 'hourly' | 'daily' | 'weekly') {
  try {
    const redis = getRedisClient();
    const cacheKey = `analytics:aggregation:${period}:data`;
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached as string) : null;
  } catch {
    return null;
  }
}

/**
 * Clear aggregation cache (use when new data is imported)
 */
export async function clearAggregationCache() {
  try {
    const redis = getRedisClient();
    await Promise.all([
      redis.del('analytics:aggregation:hourly:last-run'),
      redis.del('analytics:aggregation:daily:last-run'),
      redis.del('analytics:aggregation:weekly:last-run'),
      redis.del('analytics:aggregation:hourly:data'),
      redis.del('analytics:aggregation:daily:data'),
      redis.del('analytics:aggregation:weekly:data'),
    ]);
  } catch {
    // Redis not available
  }
}
