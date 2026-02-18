
import { calculateGap, normalizeGap } from '../src/lib/scoring/number';
import { calculatePriorityScore } from '../src/lib/scoring/compute';

console.log('--- Verifying Scoring Logic ---');

const testCases = [
  { target: 3, current: 2, expectedGap: 1, desc: 'Gap 1.0 (Underperforming)' },
  { target: 3, current: 3, expectedGap: 0, desc: 'Gap 0.0 (On Target)' },
  { target: 3, current: 4, expectedGap: 0, desc: 'Gap -1.0 (Overperforming -> 0)' },
  { target: 3, current: 5, expectedGap: 0, desc: 'Gap -2.0 (Overperforming -> 0)' },
];

let failed = false;

testCases.forEach(({ target, current, expectedGap, desc }) => {
  const gap = calculateGap(target, current);
  if (gap !== expectedGap) {
    console.error(`[FAIL] ${desc}: Expected ${expectedGap}, got ${gap}`);
    failed = true;
  } else {
    console.log(`[PASS] ${desc}`);
  }
});

const priority = calculatePriorityScore(5, 3, 0); // Current 5, Target 3, Gap 0
console.log(`Priority (Current=5, Target=3, Gap=0): ${priority}`);
if (priority > 1.0) { // Should be low priority
    console.warn('[WARN] Priority seems high for over-performing item');
}

if (failed) {
  console.error('--- Verification FAILED ---');
  process.exit(1);
} else {
  console.log('--- Verification PASSED ---');
}
