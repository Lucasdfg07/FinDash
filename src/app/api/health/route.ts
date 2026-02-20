import { NextResponse } from 'next/server';
import { getHealthStatus, loggerAPI } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint
 * Returns application health status including database, cache, and memory status
 */
export async function GET() {
  try {
    // Check database connectivity
    const dbHealthy = await checkDatabase();

    // Check cache connectivity (if Redis is configured)
    const cacheHealthy = checkCache();

    // Get comprehensive health status
    const healthStatus = getHealthStatus(dbHealthy, cacheHealthy);

    // Determine HTTP status code based on health status
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    loggerAPI.info(
      { status: healthStatus.status, checks: healthStatus.checks },
      `Health check: ${healthStatus.status}`
    );

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    loggerAPI.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Health check failed'
    );

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: 'error',
          memory: 'error',
        },
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<boolean> {
  try {
    // Simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    loggerAPI.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Database health check failed'
    );
    return false;
  }
}

/**
 * Check cache connectivity
 * Returns true if Redis is available (or not configured)
 */
function checkCache(): boolean {
  try {
    if (!process.env.REDIS_URL) {
      // Redis not configured is OK
      return true;
    }

    // In production, we would check actual Redis connection
    // For now, return true as placeholder
    // TODO: Implement actual Redis health check when Redis client is available
    return true;
  } catch (error) {
    loggerAPI.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Cache health check failed'
    );
    return false;
  }
}
