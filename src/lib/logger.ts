import pino from 'pino';

/**
 * Structured Logging com Pino
 *
 * Níveis:
 * - fatal (60): Erro fatal, aplicação vai crashear
 * - error (50): Erro não fatal
 * - warn (40): Aviso, algo anormal aconteceu
 * - info (30): Informações úteis
 * - debug (20): Informações de debug
 * - trace (10): Muito detalhado
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Development-friendly output
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Production: JSON formatted
  ...(isProduction && {
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        responseTime: res.responseTime,
      }),
    },
  }),
});

// ========================
// Logger Instances
// ========================

export const loggerAPI = logger.child({ module: 'api' });
export const loggerAuth = logger.child({ module: 'auth' });
export const loggerDB = logger.child({ module: 'database' });
export const loggerCache = logger.child({ module: 'cache' });
export const loggerPerformance = logger.child({ module: 'performance' });
export const loggerSecurity = logger.child({ module: 'security' });
export const loggerError = logger.child({ module: 'error' });

// ========================
// Structured Logging
// ========================

/**
 * Log API request
 */
export function logAPIRequest(method: string, path: string, userId?: string) {
  loggerAPI.info({ method, path, userId }, `${method} ${path}`);
}

/**
 * Log API response with duration
 */
export function logAPIResponse(method: string, path: string, status: number, duration: number) {
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  loggerAPI[level](
    { method, path, status, duration_ms: duration },
    `${method} ${path} ${status} (${duration}ms)`
  );
}

/**
 * Log authentication event
 */
export function logAuthEvent(event: 'login' | 'logout' | 'failed', userId: string, reason?: string) {
  const level = event === 'failed' ? 'warn' : 'info';
  loggerAuth[level]({ event, userId, reason }, `Auth: ${event} for user ${userId}`);
}

/**
 * Log database query
 */
export function logDBQuery(query: string, duration: number, rows?: number) {
  const level = duration > 1000 ? 'warn' : 'debug';
  loggerDB[level]({ query, duration_ms: duration, rows }, `DB query took ${duration}ms`);
}

/**
 * Log cache hit/miss
 */
export function logCacheEvent(event: 'hit' | 'miss', key: string, ttl?: number) {
  loggerCache.debug({ event, key, ttl }, `Cache ${event}: ${key}`);
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
  const level = value > 1000 ? 'warn' : 'info';
  loggerPerformance[level]({ metric, value, unit }, `${metric}: ${value}${unit}`);
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: 'auth_failed' | 'rate_limit' | 'invalid_input' | 'cors_rejected',
  details: Record<string, any>
) {
  loggerSecurity.warn({ event, ...details }, `Security: ${event}`);
}

/**
 * Log error with context
 */
export function logError(error: Error, context: Record<string, any> = {}) {
  loggerError.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message
  );
}

/**
 * Log fatal error
 */
export function logFatalError(error: Error, context: Record<string, any> = {}) {
  loggerError.fatal(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message
  );
}

// ========================
// Performance Tracking
// ========================

/**
 * Measure and log function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    logPerformanceMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(error as Error, { function: name, duration_ms: duration });
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;

    logPerformanceMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(error as Error, { function: name, duration_ms: duration });
    throw error;
  }
}

// ========================
// Health Check
// ========================

/**
 * Health check endpoint data
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    cache?: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'error';
  };
}

export function getHealthStatus(dbStatus: boolean, cacheStatus?: boolean): HealthStatus {
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  const database: 'ok' | 'error' = dbStatus ? 'ok' : 'error';
  const cache: 'ok' | 'error' = cacheStatus ? 'ok' : 'error';
  const memory: 'ok' | 'warning' | 'error' = memPercent > 90 ? 'error' : memPercent > 75 ? 'warning' : 'ok';

  const checks = {
    database,
    cache,
    memory,
  };

  const dbOk = checks.database === 'ok';
  const memOk = checks.memory === 'ok';
  const status = !dbOk || !memOk ? 'unhealthy' : memPercent > 75 ? 'degraded' : 'healthy';

  if (status !== 'healthy') {
    logger.warn({ checks }, `Health check: ${status}`);
  }

  return {
    status: status as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}

export default logger;
