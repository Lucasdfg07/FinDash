import { ReactNode, useMemo } from 'react';

interface ResponsiveChartContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  height?: number; // in pixels, default 400
}

/**
 * Responsive wrapper for charts that adapts to mobile/tablet/desktop
 * Handles:
 * - Responsive height based on viewport
 * - Loading state
 * - Touch-friendly margins and padding
 * - Dark mode support via CSS variables
 */
export function ResponsiveChartContainer({
  children,
  title,
  subtitle,
  loading = false,
  height = 400,
}: ResponsiveChartContainerProps) {
  // Calculate responsive height
  const responsiveHeight = useMemo(() => {
    if (typeof window === 'undefined') return height;

    // Mobile: reduce height for space
    if (window.innerWidth < 768) {
      return Math.max(250, height * 0.6);
    }

    // Tablet: moderate height
    if (window.innerWidth < 1024) {
      return Math.max(300, height * 0.8);
    }

    // Desktop: full height
    return height;
  }, [height]);

  return (
    <div
      className="w-full bg-[var(--bg-secondary)] rounded-lg p-4 md:p-6 border border-[var(--border-color)]"
      role="region"
      aria-label={title || 'Chart'}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div
          className="flex items-center justify-center"
          style={{ height: responsiveHeight }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              Carregando gráfico...
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <div
          className="w-full overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6"
          style={{ height: responsiveHeight }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
