/**
 * Metrics Aggregation Cron Job
 * Scheduled background jobs for time-series aggregation
 * - Hourly aggregation: Every hour at minute 5
 * - Daily aggregation: Every day at 2 AM
 * - Weekly aggregation: Every Monday at 3 AM
 */

import cron, { ScheduledTask } from 'node-cron';
import {
  aggregateHourly,
  aggregateDaily,
  aggregateWeekly,
  clearAggregationCache,
} from '@/lib/analytics-aggregator';

let scheduledJobs: ScheduledTask[] = [];

/**
 * Initialize all aggregation cron jobs
 */
export function initializeAggregationJobs() {
  console.log('[Analytics] Initializing aggregation cron jobs...');

  // Hourly aggregation at minute 5 of every hour
  const hourlyJob = cron.schedule('5 * * * *', async () => {
    try {
      console.log('[Analytics] Running hourly aggregation...');
      const result = await aggregateHourly();
      console.log(`[Analytics] Hourly aggregation completed: ${result.aggregatesCreated} aggregates in ${result.executionTimeMs}ms`);
    } catch (error) {
      console.error('[Analytics] Error in hourly aggregation:', error);
    }
  });

  // Daily aggregation at 2 AM UTC
  const dailyJob = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Analytics] Running daily aggregation...');
      const result = await aggregateDaily();
      console.log(`[Analytics] Daily aggregation completed: ${result.aggregatesCreated} aggregates in ${result.executionTimeMs}ms`);
    } catch (error) {
      console.error('[Analytics] Error in daily aggregation:', error);
    }
  });

  // Weekly aggregation every Monday at 3 AM UTC
  const weeklyJob = cron.schedule('0 3 * * 1', async () => {
    try {
      console.log('[Analytics] Running weekly aggregation...');
      const result = await aggregateWeekly();
      console.log(`[Analytics] Weekly aggregation completed: ${result.aggregatesCreated} aggregates in ${result.executionTimeMs}ms`);
    } catch (error) {
      console.error('[Analytics] Error in weekly aggregation:', error);
    }
  });

  scheduledJobs = [hourlyJob, dailyJob, weeklyJob];
  console.log('[Analytics] Aggregation cron jobs initialized');
}

/**
 * Stop all aggregation cron jobs
 */
export function stopAggregationJobs() {
  console.log('[Analytics] Stopping aggregation cron jobs...');
  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs = [];
  console.log('[Analytics] Aggregation cron jobs stopped');
}

/**
 * Manually trigger aggregation for all periods
 */
export async function triggerFullAggregation() {
  try {
    console.log('[Analytics] Triggering full aggregation...');
    const [hourly, daily, weekly] = await Promise.all([
      aggregateHourly(),
      aggregateDaily(),
      aggregateWeekly(),
    ]);

    console.log('[Analytics] Full aggregation completed:', {
      hourly: `${hourly.aggregatesCreated} aggregates`,
      daily: `${daily.aggregatesCreated} aggregates`,
      weekly: `${weekly.aggregatesCreated} aggregates`,
    });

    return { hourly, daily, weekly };
  } catch (error) {
    console.error('[Analytics] Error in full aggregation:', error);
    throw error;
  }
}

/**
 * Invalidate aggregation cache (call when new data is imported)
 */
export async function invalidateAggregationCache() {
  try {
    console.log('[Analytics] Invalidating aggregation cache...');
    await clearAggregationCache();
    console.log('[Analytics] Aggregation cache invalidated');
  } catch (error) {
    console.error('[Analytics] Error invalidating cache:', error);
  }
}
