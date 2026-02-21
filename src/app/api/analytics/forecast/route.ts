import { NextResponse } from 'next/server';
import { forecastSpending } from '@/lib/analytics-engine';

/**
 * GET /api/analytics/forecast
 * Get spending forecasts for next 30 days
 */
export async function GET() {
  try {
    const forecasts = await forecastSpending();
    return NextResponse.json(forecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 });
  }
}
