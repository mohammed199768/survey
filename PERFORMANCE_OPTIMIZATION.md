# Performance Optimization Report

## 1. Core Web Vitals Analysis (Estimated)

| Metric | Estimated Status | Root Cause |
|--------|------------------|------------|
| **LCP** (Largest Contentful Paint) | ⚠️ **Slow** | Client-side fetching on key pages (Dashboard, Landing) delays content render. |
| **CLS** (Cumulative Layout Shift) | ✅ **Good** | Layouts seem stable with `min-h-screen`. Skeleton loaders are used. |
| **INP** (Interaction to Next Paint) | ⚠️ **Risk** | Heavy calculations in `ResultsClient` could block main thread. |
| **TTFB** (Time to First Byte) | ✅ **Good** | Static shell served quickly (Next.js default). |

## 2. Rendering Performance Issues

### Re-render Analysis
#### 🟡 Moderate: `DimensionContent.tsx`
This component manages survey navigation and completion.
-   **Trigger**: It subscribes to `useReadinessStore` for `assessment`, `responses`, etc.
-   **Issue**: It re-renders whenever *any* part of the subscribed state changes, unless the selector is specific.
-   **Code Check**:
    ```typescript
    const { assessment, responses, completeAssessment, isLoading, isSubmitting } = useReadinessStore();
    ```
    **Verdict**: **Inefficient**. This subscribes to the *entire* store state updates (if referencing the hook default).
    **Fix**: Use specific selectors.
    ```typescript
    const assessment = useReadinessStore(state => state.assessment);
    const isSubmitting = useReadinessStore(state => state.isSubmitting);
    ```

#### 🟡 Moderate: `ResultsClient.tsx`
-   **Trigger**: Complex `useMemo` dependencies.
-   **Risk**: `useMemo` for `topTopics` depends on `useReadinessStore.getState().responses`. This is **incorrect pattern**. It reads the mutable state directly instead of subscribing to it. If responses change without a re-render trigger, this memo won't update, or if the component re-renders for other reasons, it might read inconsistent state.

### 🔴 Critical: `MaturityRadar.tsx` SVG Calculation
-   **Issue**: Geometry points (`getPoints`, `angles`) are calculated on every render.
-   **Impact**: Animation performance (`framer-motion`) might be jittery on low-end devices if parent triggers re-renders.
-   **Fix**: Wrap calculations in `useMemo`.

## 3. Data Fetching Strategy Optimization

### Current State: Client-Side Waterfall
Currently, `AdminDashboardPage` does:
1.  Load Page Shell (JS Bundle)
2.  Mount Component
3.  `useEffect` triggers -> `fetchDashboardData`
4.  Wait for API
5.  Render Stats

**Total Time**: Bundle Load + Script Exec + Network RTT + API Process.
**Optimization**: Move to **Server Components**:
```typescript
// app/admin/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await DashboardAPI.getStats('30d'); // Direct Server-to-Server call
  
  return <DashboardClient data={data} />;
}
```
**Gain**: Eliminated Client-Server Network RTT for initial data. Faster LCP.

### API Client Optimization
-   **Retries**: `ApiClient` implements exponential backoff. **Excellent**.
-   **Caching**: `fetch` in `client.ts` uses default behavior.
-   **Recommendation**: Use Next.js `fetch` caching options (`next: { revalidate: 3600 }`) for semi-static data like "Definitions" (`loadDefinitions`).

## 4. Bundle Size & Code Splitting

### Findings
-   `framer-motion` is used in `MaturityRadar`. This is a heavy library (~30KB gzipped). Ensure it's tree-shaken.
-   `lucide-react` is used heavily. Ensure singular imports (`import { X } from 'lucide-react'`) are used (which they are).
-   **Dashboards**: Admin dashboard imports many icons and components. Next.js auto-chunks this, but the Charting libraries (if added later) should be lazily loaded.

## 5. Image Optimization
-   **Check**: `globals.css` does not define image defaults.
-   **Code**: `MaturityRadar` is SVG. No raster images observed in the reviewed code.
-   **Recommendation**: If `User` avatars or `Organization` logos are added, ensure `<Image />` from `next/image` is used instead of `<img>`.

## 6. Performance Recommendations

### Priority 1: Optimization (Immediate)
-   [ ] **Fix Store Selectors**: Update `DimensionContent` to use atomic selectors to prevent unnecessary re-renders.
    ```typescript
    // BAD
    const { isSubmitting } = useReadinessStore();
    // GOOD
    const isSubmitting = useReadinessStore(s => s.isSubmitting);
    ```

### Priority 2: Architectural (Short Term)
-   [ ] **Server-Side Data Fetching**: migrate `AdminDashboardPage` to Server Component.
-   [ ] **Memoize Charts**: Wrap `MaturityRadar` geometry calculations in `useMemo`.

### Priority 3: Loading Performance
-   [ ] **Parallel Loading**: In `readiness.store.ts`, `loadAssessment` and `loadDefinitions` are called. Ensure they run in parallel (Promis.all) if possible. (Current implementation in `page.tsx` calls them sequentially in effect? No, effectively parallel as async calls).
