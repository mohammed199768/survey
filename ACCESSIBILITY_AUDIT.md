# Accessibility (a11y) Audit

## Executive Summary
| Category | Status | Assessment |
|----------|--------|------------|
| **Semantic HTML** | ✅ Good | Usage of `<header>`, `<main>`, `<aside>`, `<button>`. |
| **Keyboard Nav** | ⚠️ Issues | Custom interactive elements (Charts, Sliders) need verification. |
| **ARIA** | ❌ Poor | Missing labels on icons; complex widgets (Radar) lack roles. |
| **Contrast** | ⚠️ Mixed | Light grays (`slate-400`, `gray-400`) might fail AA on white. |

## 1. Critical Issues identified

### ❌ Inaccessible Chart (`MaturityRadar.tsx`)
The radar chart is a raw SVG.
```tsx
<svg viewBox="0 0 320 320">
  {/* Content */}
</svg>
```
**Problem**: Screen reader users perceive this as... nothing or a graphic without description.
**Fix**: Add `role="img"` and a `<title>`/`<desc>`.
```tsx
<svg role="img" aria-labelledby="radar-title radar-desc">
  <title id="radar-title">Maturity Radar Chart</title>
  <desc id="radar-desc">
    Chart showing scores: Strategy {scores.strategy}, People {scores.people}...
  </desc>
</svg>
```

### ❌ Decorative vs. Functional Icons
File: `src/app/admin/layout.tsx`
-   The sidebar icons are strictly decorative next to text.
-   **Current**: `<svg ...>`
-   **Issue**: SVGs can sometimes be announced as "image" or "group" by screen readers.
-   **Fix**: Add `aria-hidden="true"` to all decorative icons.

File: `AssessmentForm.tsx` (Dismiss/Close Buttons)
-   **Current**: `X` icon inside a button.
-   **Issue**: If there is no text, screen readers read nothing.
-   **Fix**: Add `aria-label="Close"` to the `<button>`.

### ⚠️ Custom Sliders (`DualSlider.tsx`)
(Code not fully reviewed, but `TopicCard` imports it).
-   **Requirement**: Ensure `input[type="range"]` or `role="slider"` is used correctly.
-   **Style Note**: `globals.css` defines `:focus-visible` styles for `input[type="range"]`. This is **Excellent**. It suggests the underlying implementation uses native inputs, which is good for accessibility.

## 2. Color Contrast Review
-   **Primary Blue**: `#348AC7`.
    -   On White (#FFF): Ratio ~3.9:1. **Fails AA for small text** (needs 4.5:1). Passes for large text (3:1).
    -   **Recommendation**: Darken slightly to `#2C7AAE` or ensures it is used only for Large Text / Graphics.
-   **Gray Text**: `.text-slate-500` / `.text-gray-500`.
    -   Usually these are accessible, but check small font sizes.

## 3. Keyboard Navigation
-   **Modals**: `AssessmentForm.tsx` has a backdrop click handler.
    -   **Missing**: Focus Trap. When the modal opens, focus should stay inside it. Current code does not show `FocusTrap` usage or `useEffect` to manage focus.
-   **Forms**: Standard inputs are keyboard accessible by default.

## 4. Remediation Plan

### Immediate Actions
1.  **Add `aria-label` to all Icon-only buttons** (Close, Delete, Add).
2.  **Fix Radar Chart**: Add `<title>` and `role="img"` to the SVG. even better, provide a screen-reader-only `<table>` summary of the chart data.
3.  **Contrast Check**: Verify `#348AC7` usage on text. If used for body text, darken it.

### Long Term
1.  **Focus Management**: Implement a `useFocusTrap` hook for Modals and Dialogs.
2.  **Announcers**: Use `aria-live` regions for status updates (e.g., "Saving...", "Assessment Updated").
