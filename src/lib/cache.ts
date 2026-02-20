import { cache } from "react";

/**
 * Cache Strategy for Findash
 *
 * Levels:
 * 1. React Request Cache (cache()) - During a request
 * 2. HTTP Cache-Control - Browser/CDN caching
 * 3. Redis Cache - Distributed cache (production)
 */

// ========================
// React Request Cache
// ========================

/**
 * Get transactions for a date range
 * Cached during the same request
 */
export const getCachedTransactions = cache(async (startDate: Date, endDate: Date) => {
  const { prisma } = await import("./prisma");

  return await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
  });
});

/**
 * Get dashboard summary
 * Cached during the same request
 */
export const getCachedDashboardSummary = cache(async (month: Date) => {
  const { prisma } = await import("./prisma");

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  const [transactions, cardTransactions, categories, fixedCosts] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.cardTransaction.findMany({
      where: {
        invoiceMonth: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        type: true,
      },
    }),
    prisma.fixedCost.findMany({
      where: {
        active: true,
      },
    }),
  ]);

  // Calculate totals
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const cardExpenses = cardTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const fixedCostTotal = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);

  return {
    income,
    expenses,
    cardExpenses,
    fixedCostTotal,
    totalExpenses: expenses + cardExpenses + fixedCostTotal,
    balance: income - (expenses + cardExpenses + fixedCostTotal),
    transactions: transactions.length,
    cardTransactions: cardTransactions.length,
    categories: categories.length,
  };
});

/**
 * Get user settings
 * Cached during the same request
 */
export const getCachedUserSettings = cache(async (userId: string) => {
  const { prisma } = await import("./prisma");

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "user_currency",
          "user_language",
          "user_theme",
          "user_timezone",
          "inter_last_sync",
        ],
      },
    },
  });

  return settings.reduce(
    (acc, setting) => ({
      ...acc,
      [setting.key]: setting.value,
    }),
    {} as Record<string, string>
  );
});

// ========================
// Cache Invalidation
// ========================

/**
 * Invalidate dashboard cache after transaction changes
 */
export const invalidateDashboardCache = async () => {
  // In production, also invalidate Redis cache
  if (process.env.REDIS_URL) {
    try {
      const redis = await import("redis");
      // const client = redis.createClient({ url: process.env.REDIS_URL });
      // await client.del("dashboard:*");
    } catch (error) {
      console.error("Failed to invalidate Redis cache:", error);
    }
  }
};

/**
 * Invalidate transactions cache after sync
 */
export const invalidateTransactionsCache = async () => {
  if (process.env.REDIS_URL) {
    try {
      // const client = redis.createClient({ url: process.env.REDIS_URL });
      // await client.del("transactions:*");
    } catch (error) {
      console.error("Failed to invalidate Redis cache:", error);
    }
  }
};

// ========================
// Next.js ISR (Incremental Static Regeneration)
// ========================

/**
 * Revalidate paths that depend on dashboard data
 */
export const revalidateDashboardPaths = async () => {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to revalidate paths:", error);
  }
};

/**
 * Get cache control headers for API responses
 */
export function getCacheHeaders(maxAge: number = 60) {
  return {
    "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    "CDN-Cache-Control": `max-age=${maxAge}`,
  };
}

// ========================
// Performance Metrics
// ========================

/**
 * Track cache hit rate
 */
let cacheHits = 0;
let cacheMisses = 0;

export function trackCacheHit() {
  cacheHits++;
}

export function trackCacheMiss() {
  cacheMisses++;
}

export function getCacheMetrics() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: `${hitRate.toFixed(2)}%`,
  };
}

export function resetCacheMetrics() {
  cacheHits = 0;
  cacheMisses = 0;
}
