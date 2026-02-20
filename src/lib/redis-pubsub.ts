import { Redis } from '@upstash/redis';
import { AnyRealtimeEvent } from '@/types/realtime';

/**
 * Redis Pub/Sub Manager
 * Handles publishing and subscription to Redis channels
 */

let redisInstance: Redis | null = null;

/**
 * Get or create Redis instance
 */
export function getRedisClient(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis credentials not configured');
    }

    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisInstance;
}

/**
 * Publish event to a Redis channel
 */
export async function publishEvent(
  channel: string,
  event: AnyRealtimeEvent
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.publish(channel, JSON.stringify(event));
  } catch (error) {
    console.error(`Error publishing to channel ${channel}:`, error);
    // Don't throw - graceful degradation if Redis is unavailable
  }
}

/**
 * Publish transaction created event
 */
export async function publishTransactionCreated(
  userId: string,
  transaction: any
): Promise<void> {
  await publishEvent(`transactions:${userId}`, {
    type: 'transaction:created',
    data: transaction,
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish transaction updated event
 */
export async function publishTransactionUpdated(
  userId: string,
  id: string,
  changes: any
): Promise<void> {
  await publishEvent(`transactions:${userId}`, {
    type: 'transaction:updated',
    data: { id, changes },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish transaction deleted event
 */
export async function publishTransactionDeleted(
  userId: string,
  id: string
): Promise<void> {
  await publishEvent(`transactions:${userId}`, {
    type: 'transaction:deleted',
    data: { id },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish category created event
 */
export async function publishCategoryCreated(
  userId: string,
  category: any
): Promise<void> {
  await publishEvent(`categories:${userId}`, {
    type: 'category:created',
    data: category,
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish category updated event
 */
export async function publishCategoryUpdated(
  userId: string,
  id: string,
  changes: any
): Promise<void> {
  await publishEvent(`categories:${userId}`, {
    type: 'category:updated',
    data: { id, changes },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish category deleted event
 */
export async function publishCategoryDeleted(
  userId: string,
  id: string
): Promise<void> {
  await publishEvent(`categories:${userId}`, {
    type: 'category:deleted',
    data: { id },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish dashboard invalidation event
 */
export async function publishDashboardInvalidate(
  userId: string,
  keys: string[]
): Promise<void> {
  await publishEvent(`dashboard:${userId}`, {
    type: 'dashboard:invalidate',
    data: { keys },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish bank sync started event
 */
export async function publishBankSyncStart(userId: string): Promise<void> {
  await publishEvent(`dashboard:${userId}`, {
    type: 'bank:sync:start',
    data: { status: 'syncing' },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish bank sync progress event
 */
export async function publishBankSyncProgress(
  userId: string,
  imported: number,
  duplicates: number
): Promise<void> {
  await publishEvent(`dashboard:${userId}`, {
    type: 'bank:sync:progress',
    data: { status: 'syncing', imported, duplicates },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish bank sync completed event
 */
export async function publishBankSyncComplete(
  userId: string,
  imported: number,
  duplicates: number
): Promise<void> {
  await publishEvent(`dashboard:${userId}`, {
    type: 'bank:sync:complete',
    data: { status: 'complete', imported, duplicates },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish fixed cost created event
 */
export async function publishFixedCostCreated(
  userId: string,
  fixedCost: any
): Promise<void> {
  await publishEvent(`fixed-costs:${userId}`, {
    type: 'fixed-cost:created',
    data: fixedCost,
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish fixed cost updated event
 */
export async function publishFixedCostUpdated(
  userId: string,
  id: string,
  changes: any
): Promise<void> {
  await publishEvent(`fixed-costs:${userId}`, {
    type: 'fixed-cost:updated',
    data: { id, changes },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}

/**
 * Publish fixed cost deleted event
 */
export async function publishFixedCostDeleted(
  userId: string,
  id: string
): Promise<void> {
  await publishEvent(`fixed-costs:${userId}`, {
    type: 'fixed-cost:deleted',
    data: { id },
    timestamp: new Date().toISOString(),
    userId,
  } as any);
}
