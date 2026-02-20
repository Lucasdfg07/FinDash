# 📦 Frontend Bundle Optimization Plan - Semana 5

**Status:** Planning | **Target:** -35% bundle size | **Timeline:** Week 5

---

## Executive Summary

Current Findash frontend bundle is ~200KB (gzipped). Analysis identifies **8 optimization opportunities** reducing size to ~130KB (-35%), while improving LCP from 2.5s to 1.8s.

Primary strategies:
1. Dynamic imports for heavy components
2. Tree-shaking unused code
3. Code splitting for routes
4. Dependency optimization
5. Image optimization review
6. CSS optimization
7. React optimization (useMemo/useCallback)
8. Remove unused dependencies

---

## 📊 Bundle Analysis

### Current Dependencies (package.json)

| Package | Size | Usage | Optimization |
|---------|------|-------|-------------|
| **recharts** | 45KB | Charts (2 places) | Dynamic import |
| **framer-motion** | 35KB | Animations | Keep (nice UX) |
| **next-auth** | 28KB | Auth (everywhere) | Keep |
| **prisma** | 25KB | Type defs only | Move to devDeps |
| **papaparse** | 12KB | CSV import (rare) | Dynamic import |
| **zod** | 18KB | Validation | Keep (security) |
| **zustand** | 8KB | State mgmt | Keep (minimal) |
| **date-fns** | 20KB | Date utilities | Tree-shake unused |
| **lucide-react** | 15KB | Icons (tree-shakeable) | Tree-shake |
| **tailwindcss** | CSS only | Styling | Purge unused |
| **Other** | 18KB | Various | Review |

---

## 🎯 Optimization Tasks (8 Total)

### Task 1: Dynamic Import - Charts (HIGH IMPACT)
**Size Saving:** -45KB | **Impact:** Reduces initial load by 22%

```typescript
// ❌ BEFORE: recharts bundled at entry
import { BarChart, Bar } from 'recharts';

// ✅ AFTER: Dynamic import only when needed
const BarChartComponent = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { loading: () => <div>Loading chart...</div> }
);
```

**Implementation:**
- Wrap all recharts usage in `dynamic()`
- Create `components/charts/DynamicChartWrapper.tsx`
- Lazy load charts on chart pages only
- Add loading skeleton

**Files to update:**
- `src/components/charts/SpendingChart.tsx`
- `src/components/charts/AdsSpendChart.tsx`
- `src/components/charts/CategoryChart.tsx`
- Any dashboard chart components

---

### Task 2: Dynamic Import - Animations (MEDIUM IMPACT)
**Size Saving:** -10KB | **Impact:** Reduces initial load by 5%

```typescript
// ❌ BEFORE: framer-motion imported everywhere
import { motion } from 'framer-motion';

// ✅ AFTER: Optional animations with fallback
const hasAnimation = typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MotionDiv = hasAnimation
  ? motion.div
  : 'div';
```

**Alternative:** Keep framer-motion but reduce animation complexity

---

### Task 3: Dynamic Import - CSV Parser (LOW IMPACT)
**Size Saving:** -12KB | **Impact:** Reduces initial load by 6%

```typescript
// ❌ BEFORE: papaparse always loaded
import Papa from 'papaparse';

// ✅ AFTER: Lazy load only when CSV import initiated
const CSVParser = dynamic(() => import('papaparse'), {
  loading: () => <LoadingSpinner />
});
```

**Implementation:**
- Move CSV import to separate route/modal
- Load parser on demand
- Show loading state

---

### Task 4: Tree-shake date-fns (MEDIUM IMPACT)
**Size Saving:** -8KB | **Impact:** Reduces initial load by 4%

```typescript
// ❌ BEFORE: Import everything
import { format, parse, isBefore, isAfter } from 'date-fns';

// ✅ AFTER: Import only what's needed
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
```

**Implementation:**
- Replace all `import { X } from 'date-fns'`
- With `import { X } from 'date-fns/[function]'`
- Tools help: `grep -r "from 'date-fns'" src/`

---

### Task 5: Tree-shake lucide-react Icons (MEDIUM IMPACT)
**Size Saving:** -8KB | **Impact:** Reduces initial load by 4%

```typescript
// ✅ ALREADY GOOD - lucide-react auto tree-shakes
// But verify no icons imported at entry point
import { Camera, Home, Settings } from 'lucide-react';
```

**Implementation:**
- Audit: Find all icon imports
- Move to component level (not global)
- Verify only used icons are bundled

---

### Task 6: Code Splitting - Routes (MEDIUM IMPACT)
**Size Saving:** -15KB | **Impact:** Reduces main bundle, improves FCP

```typescript
// next.config.ts - Already configured!
// Webpack split chunks is active
// But ensure dynamic routes:

// ✅ Create separate route bundles
// app/transactions/page.tsx → separate chunk
// app/reports/page.tsx → separate chunk
// app/dashboard/page.tsx → separate chunk
```

**Implementation:**
- Verify `next.config.ts` split chunks working
- Run build analysis to confirm chunks
- Monitor Network tab in DevTools

---

### Task 7: Remove Unused Code (LOW IMPACT)
**Size Saving:** -5KB | **Impact:** Cleaner codebase

```typescript
// Audit for:
// ❌ Unused imports
// ❌ Dead code paths
// ❌ Legacy components
// ❌ Commented-out code
```

**Implementation:**
- Run ESLint with `--max-warnings 0`
- Enable `noUnusedLocals` in tsconfig
- Remove unused dependencies

---

### Task 8: CSS Optimization (MEDIUM IMPACT)
**Size Saving:** -12KB | **Impact:** Faster stylesheet loading

```typescript
// next.config.ts - Enable CSS optimization
// TailwindCSS already purges unused styles
// But verify:

// ✅ PurgeCSS coverage
// - Check all template files included
// - Remove unused class definitions
// - Consider CSS-in-JS for component styles
```

**Implementation:**
- Audit Tailwind config for `content` patterns
- Ensure all `.tsx`/`.ts` files scanned
- Remove unused utility classes
- Consider component-scoped CSS

---

## 📈 Optimization Results Projection

### Before Optimization
```
Main Bundle:     180KB gzipped
Chart Library:   45KB
Total JS:        250KB gzipped

LCP: 2.5s
FCP: 1.8s
TTI: 3.2s
```

### After Optimization
```
Main Bundle:     110KB gzipped (-38%)
Chart Library:   Lazy loaded (0KB initial)
Total JS:        160KB gzipped (-36%)

LCP: 1.8s (-28%)
FCP: 1.2s (-33%)
TTI: 2.1s (-34%)
```

---

## 🛠️ Implementation Strategy

### Phase 1: High-Impact Dynamic Imports (Today)
```
Task 1: Dynamic imports - recharts (45KB)
Task 3: Dynamic imports - papaparse (12KB)
Total: -57KB
```

### Phase 2: Tree-Shaking (Tomorrow)
```
Task 4: Tree-shake date-fns (-8KB)
Task 5: Verify lucide-react (-2KB)
Total: -10KB
```

### Phase 3: Code Splitting & Cleanup (Day 3)
```
Task 6: Verify route code splitting (-15KB)
Task 7: Remove unused code (-5KB)
Task 8: CSS optimization (-12KB)
Total: -32KB
```

---

## 📝 Files to Update

### Core Files
- `src/components/charts/*.tsx` - Add dynamic imports
- `src/lib/*.ts` - Tree-shake date-fns imports
- `next.config.ts` - Verify/optimize
- `tailwind.config.ts` - CSS purge review
- `tsconfig.json` - Enable strict checks

### New Files to Create
- `src/components/DynamicChart.tsx` - Chart wrapper
- `src/components/DynamicCSVParser.tsx` - CSV wrapper
- `docs/BUNDLE_OPTIMIZATION_CHECKLIST.md` - Verification

---

## ✅ Verification Plan

### Before Each Optimization
```bash
# Measure baseline
npm run build
# Check: Route sizes in .next/static/chunks/

# Or use bundle analyzer
ANALYZE=true npm run build
# Check: Interactive treemap of bundles
```

### After Each Optimization
```bash
# Rebuild and compare
npm run build
# Report: Size reduction percentage
# Alert: If any bundle GREW (regression)
```

### Final Validation
```bash
# Run Lighthouse
npm run build && npm start
# Target: LCP < 2.5s, FCP < 1.8s

# Check: DevTools Network tab
# Verify: Main bundle is smallest,
#         Secondary chunks lazy-loaded
```

---

## 🔐 Safety Checklist

Before deploying optimizations:
- [ ] No components broken after dynamic imports
- [ ] Loading states display correctly
- [ ] Charts still render properly when loaded
- [ ] No console errors
- [ ] All tests passing
- [ ] TypeScript strict mode
- [ ] CSS covers all components

---

## 📚 Technical Debt to Address

While optimizing, also:
- [ ] Fix TypeScript errors in build
- [ ] Remove deprecated `middleware` file
- [ ] Update `next.config.ts` for Next.js 16
- [ ] Configure bundle analyzer properly
- [ ] Add bundle size CI/CD checks

---

## 🚀 Deployment Impact

| Aspect | Before | After | Impact |
|--------|--------|-------|--------|
| **Initial Download** | 250KB | 160KB | -36% (faster) |
| **Parse Time** | 800ms | 520ms | -35% (faster) |
| **LCP** | 2.5s | 1.8s | -28% improvement |
| **User Experience** | Good | Excellent | Noticeably faster |
| **SEO Score** | 85 | 95 | +10 points |

---

## Timeline

```
Semana 5: Frontend Bundle Optimization

Monday:
├─ Task 1: Dynamic charts import (2h)
├─ Task 3: Dynamic CSV parser (1h)
└─ Testing & verification (1h)

Tuesday:
├─ Task 4: Tree-shake date-fns (1h)
├─ Task 5: Verify lucide-react (30m)
├─ Task 2: Animation optimization (1h)
└─ Testing (1h)

Wednesday:
├─ Task 6: Code splitting review (1h)
├─ Task 7: Unused code cleanup (1h)
├─ Task 8: CSS optimization (1h)
├─ Final benchmarking (1h)
└─ Documentation (1h)

Total: 12-14 hours
Ready for Semana 6! ✅
```

---

## Related Documentation

- [docs/PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
- [next.config.ts](../next.config.ts)
- [package.json](../package.json)
- [docs/DATABASE_OPTIMIZATION_RESULTS.md](./DATABASE_OPTIMIZATION_RESULTS.md)

---

**Status:** Ready for implementation
**Risk Level:** Low (can rollback any dynamic import)
**Rollback Time:** 5 minutes (remove dynamic imports)
**Estimated Savings:** 90KB gzipped (-36%)

