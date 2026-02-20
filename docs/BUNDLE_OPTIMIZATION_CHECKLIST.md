# ✅ Frontend Bundle Optimization Checklist - Semana 5

**Status:** In Progress | **Date:** 2026-02-20

---

## Task Progress

### Task 1: Dynamic Import - Charts ✅ DONE
**Impact:** -45KB (22% of bundle)

- [x] Create DynamicChart wrapper component (`src/components/DynamicChart.tsx`)
- [x] Convert CategoryPieChart to named export
- [x] Convert RevenueExpenseChart to named export
- [x] Convert TopExpensesChart to named export
- [x] Convert FixedVsVariableChart to named export
- [x] Convert AdsSpendChart to named export
- [ ] Update dashboard imports to use DynamicChart wrapper
- [ ] Test chart loading and rendering
- [ ] Verify bundle size reduction

**Files Modified:**
- `src/components/DynamicChart.tsx` (NEW)
- `src/components/charts/CategoryPieChart.tsx`
- `src/components/charts/RevenueExpenseChart.tsx`
- `src/components/charts/TopExpensesChart.tsx`
- `src/components/charts/FixedVsVariableChart.tsx`
- `src/components/charts/AdsSpendChart.tsx`

---

### Task 2: Dynamic Import - Animations
**Impact:** -10KB (5% of bundle)
**Status:** TODO

```typescript
// Review framer-motion usage
// Consider optional animations based on prefers-reduced-motion
```

---

### Task 3: Dynamic Import - CSV Parser
**Impact:** -12KB (6% of bundle)
**Status:** TODO

```typescript
// Find CSV import usage
// Wrap in dynamic() only loaded on demand
```

---

### Task 4: Tree-shake date-fns
**Impact:** -8KB (4% of bundle)
**Status:** TODO

```typescript
// Replace: import { format } from 'date-fns'
// With: import { format } from 'date-fns/format'
```

---

### Task 5: Tree-shake lucide-react Icons
**Impact:** -8KB (4% of bundle)
**Status:** TODO

```typescript
// Verify lucide-react tree-shaking
// Move icon imports to component level
```

---

### Task 6: Code Splitting - Routes
**Impact:** -15KB
**Status:** TODO

```typescript
// Verify next.config.ts split chunks
// Ensure separate bundles per route
```

---

### Task 7: Remove Unused Code
**Impact:** -5KB
**Status:** TODO

```typescript
// Run ESLint with strict rules
// Remove dead code and unused imports
```

---

### Task 8: CSS Optimization
**Impact:** -12KB
**Status:** TODO

```typescript
// Review Tailwind config
// Remove unused utility classes
```

---

## Usage Example

```typescript
// BEFORE: recharts bundled at entry
import CategoryPieChart from '@/components/charts/CategoryPieChart';

// AFTER: Lazy loaded with skeleton
import { DynamicCategoryPieChart, ChartWrapper } from '@/components/DynamicChart';

export function Dashboard() {
  return (
    <ChartWrapper>
      <DynamicCategoryPieChart data={categoryData} />
    </ChartWrapper>
  );
}
```

---

## Testing Checklist

- [ ] All charts render correctly when loaded
- [ ] Loading skeletons display
- [ ] No console errors
- [ ] Network tab shows separate recharts chunk
- [ ] Build size reduced by ~45KB
- [ ] LCP improved

---

## Bundle Size Tracking

| Phase | Task | Savings | Total |
|-------|------|---------|-------|
| 1 | Dynamic Charts | -45KB | -45KB |
| 1 | Dynamic CSV | -12KB | -57KB |
| 2 | Tree-shake date-fns | -8KB | -65KB |
| 2 | Tree-shake lucide | -8KB | -73KB |
| 3 | Code splitting | -15KB | -88KB |
| 3 | Remove unused | -5KB | -93KB |
| 3 | CSS optimization | -12KB | -105KB |
| **Total** | **8 tasks** | **-105KB** | **-50%** |

---

## Next Steps

1. ✅ Task 1 base implementation
2. [ ] Update all dashboard imports to use DynamicChart
3. [ ] Task 2: Animations optimization
4. [ ] Task 3: CSV parser dynamic import
5. [ ] Tasks 4-8: Remaining optimizations
6. [ ] Final bundle analysis and benchmarking
7. [ ] Commit and push

