'use client';

import dynamic from 'next/dynamic';
import { Suspense, ComponentType, ReactNode } from 'react';

/**
 * Dynamic chart wrapper
 * Lazy-loads chart components to reduce initial bundle size
 * Charts are loaded only when needed
 */

// Loading skeleton while chart loads
const ChartSkeleton = () => (
  <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
);

// Dynamically import chart components
export const DynamicCategoryPieChart = dynamic(
  () => import('./charts/CategoryPieChart').then(mod => ({ default: mod.CategoryPieChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Don't render on server
  }
);

export const DynamicRevenueExpenseChart = dynamic(
  () => import('./charts/RevenueExpenseChart').then(mod => ({ default: mod.RevenueExpenseChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicTopExpensesChart = dynamic(
  () => import('./charts/TopExpensesChart').then(mod => ({ default: mod.TopExpensesChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicFixedVsVariableChart = dynamic(
  () => import('./charts/FixedVsVariableChart').then(mod => ({ default: mod.FixedVsVariableChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicAdsSpendChart = dynamic(
  () => import('./charts/AdsSpendChart').then(mod => ({ default: mod.AdsSpendChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

/**
 * Wrapper component for safe chart rendering with Suspense
 */
interface ChartWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ChartWrapper({ children, fallback = <ChartSkeleton /> }: ChartWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
