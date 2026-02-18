
/**
 * Normalizes a number to the nearest step to avoid floating point artifacts.
 * Example: 1.50000002 -> 1.5
 */
export function roundToStep(value: number, step = 0.5): number {
  const inv = 1 / step;
  return Math.round(value * inv) / inv;
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalizes a score to be within the valid range (1..5) and step (0.5).
 */
export function normalizeScore(value: number): number {
  const v = roundToStep(value, 0.5);
  return clamp(v, 1, 5);
}

/**
 * Normalizes a gap to be within the valid range (0..4) and step (0.5).
 */
export function normalizeGap(value: number): number {
  const v = roundToStep(value, 0.5);
  return clamp(v, 0, 4); // 5-1=4 max gap
}

/**
 * Calculates the gap between target and current scores.
 * Clamps to 0 if current > target (negative gap).
 */
export function calculateGap(target: number, current: number): number {
  return normalizeGap(Math.max(0, target - current));
}

/**
 * Formats a score to always show 1 decimal place.
 * Example: 3.5, 4.0
 */
export function formatScore(value: number): string {
  return normalizeScore(value).toFixed(1);
}

/**
 * Formats a gap value to 1 decimal place.
 * Handles negative zero (-0.0) by converting it to 0.0.
 */
export function formatGap(value: number): string {
  const v = Math.round(value * 10) / 10;
  const clean = Object.is(v, -0) ? 0 : v;
  return clean.toFixed(1);
}
