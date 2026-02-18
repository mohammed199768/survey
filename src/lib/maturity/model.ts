export type MaturityStageId = 'explorer' | 'structured' | 'integrated' | 'optimized';

export type MaturityConfidence = 'Low' | 'Medium' | 'High';

export interface MaturityStage {
  id: MaturityStageId;
  label: string;
  description: string;
  minScore: number;
}

export interface DimensionMaturity {
  stage: MaturityStage;
  // gapAvg > 1.5 downgrade applied?
  downgradeReason?: string;
}

export interface OrganizationMaturity {
  stage: MaturityStage;
  confidenceLabel: MaturityConfidence;
  confidenceRatio: number;
  downgradeReason?: string;
}

const STAGES: Record<MaturityStageId, MaturityStage> = {
  explorer: {
    id: 'explorer',
    label: 'Explorer',
    description: 'Initial experimentation with AI. Ad-hoc initiatives with limited strategy or governance.',
    minScore: 0,
  },
  structured: {
    id: 'structured',
    label: 'Structured',
    description: 'Formalized AI programs emerging. Defined roles and basic infrastructure in place.',
    minScore: 2,
  },
  integrated: {
    id: 'integrated',
    label: 'Integrated',
    description: 'AI embedded in core workflows. Scalable platforms and cross-functional alignment.',
    minScore: 3,
  },
  optimized: {
    id: 'optimized',
    label: 'Optimized',
    description: 'AI drives strategic advantage. Continuous innovation and automated value realization.',
    minScore: 4,
  },
};

// Ordered list for easy index access
const ORDERED_STAGES: MaturityStage[] = [
  STAGES.explorer,
  STAGES.structured,
  STAGES.integrated,
  STAGES.optimized,
];

// Helper to get base stage from score
function getBaseStageIndex(score: number): number {
  if (score >= 4) return 3; // Optimized
  if (score >= 3) return 2; // Integrated
  if (score >= 2) return 1; // Structured
  return 0; // Explorer
}

/**
 * Get Dimension Maturity
 * 
 * Logic:
 * - Base stage from currentAvg
 * - If gapAvg > 1.5 -> downgrade 1 stage
 * - Clamp within bounds
 */
export function getDimensionMaturity({
  currentAvg,
  gapAvg,
}: {
  currentAvg: number;
  gapAvg: number;
}): DimensionMaturity {
  let index = getBaseStageIndex(currentAvg);
  let downgradeReason: string | undefined;

  // Downgrade logic
  if (gapAvg > 1.5) {
    if (index > 0) {
      index -= 1;
      downgradeReason = 'Large gap between current and target capabilities.';
    }
  }

  return {
    stage: ORDERED_STAGES[index],
    downgradeReason,
  };
}

/**
 * Get Organization Maturity
 * 
 * Logic:
 * - Base stage from overallCurrentAvg
 * - If confidenceRatio < 0.4 -> downgrade 1 stage
 * - If confidenceRatio < 0.2 -> downgrade 2 stages
 * - Clamp within bounds [Explorer..Optimized]
 */
export function getOrganizationMaturity({
  overallCurrentAvg,
  confidenceRatio,
}: {
  overallCurrentAvg: number;
  confidenceRatio: number;
}): OrganizationMaturity {
  let index = getBaseStageIndex(overallCurrentAvg);
  let downgradeReason: string | undefined;

  // Confidence Downgrades
  // Note: These do not stack with each other (a ratio < 0.2 matches both < 0.4 and < 0.2 conditions in theory, 
  // but we should apply the strongest penalty or sequential logic).
  // The prompt says: 
  // - < 0.4 -> downgrade 1
  // - < 0.2 -> downgrade 2
  // Let's interpret strict checks:
  
  if (confidenceRatio < 0.2) {
    if (index >= 2) {
      index -= 2;
      downgradeReason = 'Very low assessment confidence.';
    } else if (index === 1) {
      index = 0;
      downgradeReason = 'Very low assessment confidence.';
    }
  } else if (confidenceRatio < 0.4) {
    if (index > 0) {
      index -= 1;
      downgradeReason = 'Low assessment confidence.';
    }
  }

  // Determine Confidence Label
  let confidenceLabel: MaturityConfidence = 'High';
  if (confidenceRatio < 0.4) confidenceLabel = 'Low';
  else if (confidenceRatio < 0.7) confidenceLabel = 'Medium';

  return {
    stage: ORDERED_STAGES[index],
    confidenceLabel,
    confidenceRatio,
    downgradeReason,
  };
}

/*
  Boundary Case Checklist:
  [x] currentAvg = 1.9 -> Explorer
  [x] currentAvg = 2.0 -> Structured
  [x] currentAvg = 2.9 -> Structured
  [x] currentAvg = 3.0 -> Integrated
  [x] currentAvg = 3.9 -> Integrated
  [x] currentAvg = 4.0 -> Optimized
  [x] gapAvg = 1.5 -> No downgrade
  [x] gapAvg = 1.51 -> Downgrade 1 level (if possible)
  [x] confidence = 0.39 -> Downgrade 1 level
  [x] confidence = 0.19 -> Downgrade 2 levels
  [x] Downgrade clamped at Explorer (index 0)
*/
