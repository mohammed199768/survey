# Action Plan & Roadmap

## Phase 1: Critical Fixes (Immediate - Week 1)
**Goal**: Secure the application and fix A11y blockers.

-   [ ] **Security**: Migrate Auth Token from `localStorage` to **HttpOnly Cookie**. This prevents XSS token theft.
-   [ ] **A11y**: Add `role="img"` and `<title>` to `MaturityRadar` SVG.
-   [ ] **A11y**: Add `aria-label` to all icon-only buttons in `AssessmentForm` and `AdminLayout`.
-   [ ] **Type Safety**: Fix `any` in `client.ts` error handling.

## Phase 2: Performance & Architecture (Weeks 2-3)
**Goal**: Improve LCP and Render Performance.

-   [ ] **Performance**: Refactor `DimensionContent` to use atomic store selectors.
-   [ ] **Performance**: Memoize `MaturityRadar` geometry calculations.
-   [ ] **Architecture**: Create `src/middleware.ts` to protect Admin routes at the server level.
-   [ ] **Metric**: Measure LCP on Dashboard. Target < 1.5s.

## Phase 3: Refactoring & Quality (Weeks 4-6)
**Goal**: Maintainability and Scalability.

-   [ ] **Refactor**: Split `ResultsClient.tsx`. Extract logic to hooks.
-   [ ] **Forms**: Adopt `zod` for runtime validation of API responses and Form inputs.
-   [ ] **Testing**: Set up Jest/React Testing Library. Write tests for `TopicCard` and `readiness.store`.

## Summary
The application is well-structured and uses modern Next.js patterns. The biggest risks are **Security (JWT storage)** and **Accessibility (Charts)**. Performance is acceptable but has optimization headers. The Codebase is clean and ready for these improvements.
