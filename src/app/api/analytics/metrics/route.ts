import { NextResponse } from 'next/server';
import {
  aggregateHourly,
  aggregateDaily,
  aggregateWeekly,
  getCachedAggregates,
} from '@/lib/analytics-aggregator';

/**
 * GET /api/analytics/metrics
 * Get aggregated metrics for specified period
 *
 * Query params:
 * - period: 'hourly' | 'daily' | 'weekly'
 * - useCache: boolean (default: true)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'weekly';
    const useCache = searchParams.get('useCache') !== 'false';

    // Validate period
    if (!['hourly', 'daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use: hourly, daily, or weekly' },
        { status: 400 }
      );
    }

    let result;

    // Try to get from cache first
    if (useCache) {
      result = await getCachedAggregates(period);
      if (result) {
        return NextResponse.json({
          period,
          aggregates: result,
          fromCache: true,
        });
      }
    }

    // Run aggregation based on period
    const aggregationResult =
      period === 'hourly'
        ? await aggregateHourly()
        : period === 'daily'
          ? await aggregateDaily()
          : await aggregateWeekly();

    return NextResponse.json({
      period,
      aggregatesCreated: aggregationResult.aggregatesCreated,
      executionTimeMs: aggregationResult.executionTimeMs,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error fetching aggregated metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/metrics
 * Manually trigger aggregation
 *
 * Body:
 * - period: 'hourly' | 'daily' | 'weekly' | 'all'
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period = 'all' } = body;

    if (!['hourly', 'daily', 'weekly', 'all'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use: hourly, daily, weekly, or all' },
        { status: 400 }
      );
    }

    let results;

    if (period === 'all') {
      results = await Promise.all([
        aggregateHourly(),
        aggregateDaily(),
        aggregateWeekly(),
      ]);

      return NextResponse.json({
        hourly: results[0],
        daily: results[1],
        weekly: results[2],
      });
    } else {
      const result =
        period === 'hourly'
          ? await aggregateHourly()
          : period === 'daily'
            ? await aggregateDaily()
            : await aggregateWeekly();

      return NextResponse.json({
        [period]: result,
      });
    }
  } catch (error) {
    console.error('Error triggering aggregation:', error);
    return NextResponse.json(
      { error: 'Failed to trigger aggregation' },
      { status: 500 }
    );
  }
}
