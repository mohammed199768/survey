import { AssessmentDefinition, DimensionDefinition } from '../assessment/validate';
import { ReadinessState, TopicScore } from '../../store/readiness/types';
import { normalizeScore, normalizeGap, roundToStep, calculateGap } from './number';

export type DimensionScoreSummary = {
  currentAvg: number;
  targetAvg: number;
  gapAvg: number;
  answeredCount: number;
  totalCount: number;
  progress: number; // 0..100
  currentSum: number; // Added for weighted aggregation
  targetSum: number; // Added for weighted aggregation
};

export type OverallScoreSummary = {
  currentAvg: number;
  targetAvg: number;
  gapAvg: number;
  completedDimensions: number;
  totalDimensions: number;
  confidenceRatio: number;
};

export type DimensionResultModel = {
  id: string;
  title: string;
  currentAvg: number;
  targetAvg: number;
  gapAvg: number;
  answeredCount: number;
  totalCount: number;
  progress: number;
  isComplete: boolean;
};

export type TopGapModel = {
  dimensionId: string;
  dimensionTitle: string;
  topicId: string;
  topicLabel: string;
  current: number;
  target: number;
  gap: number;
};

export type ResultsModel = {
  overall: OverallScoreSummary;
  dimensions: DimensionResultModel[];
  topGaps: TopGapModel[];
};

/** Gap analysis comparison for a single dimension. */
export type DimensionComparison = {
  id: string;
  name: string;
  current: number;
  target: number;
  gap: number;
  gapPercentage: number;
  variance: number;
  trend: 'positive' | 'negative' | 'neutral';
};

/** A prioritized topic with risk assessment. */
export type TopTopic = {
  id: string;
  label: string;
  dimensionId: string;
  dimensionName: string;
  current: number;
  target: number;
  gap: number;
  priorityScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  impactArea: string;
};

/** Extended results with gap analysis and prioritized topics. */
export type EnhancedResultsModel = ResultsModel & {
  dimensionComparisons: DimensionComparison[];
  topTopics: TopTopic[];
  overallGap: number;
  maturityTrend: 'improving' | 'stable' | 'declining';
};



export function computeDimensionSummary(
  definition: DimensionDefinition,
  dimensionScores: Record<string, TopicScore>,
  dimensionTouched: Record<string, boolean>
): DimensionScoreSummary {
  const topics = definition.topics;
  
  let currentSum = 0;
  let targetSum = 0;
  let answeredCount = 0;

  topics.forEach((topic) => {
    const isTouched = dimensionTouched[topic.id];
    
    if (isTouched) {
      // Only include score if touched
      const score = dimensionScores[topic.id];
      if (score) {
        // Defensive normalization
        currentSum += normalizeScore(score.current);
        targetSum += normalizeScore(score.target);
        answeredCount++;
      } else {
        // Missing score for touched topic: SKIP IT (Do not fallback to 1)
      }
    }
  });

  const totalCount = topics.length;

  // Prevent division by zero if nothing is answered
  if (answeredCount === 0) {
    return {
      currentAvg: 0,
      targetAvg: 0,
      gapAvg: 0,
      answeredCount: 0,
      totalCount,
      progress: 0,
      currentSum: 0,
      targetSum: 0,
    };
  }

  // Average is based on ANSWERED count, not total count
  const currentAvg = normalizeScore(currentSum / answeredCount);
  const targetAvg = normalizeScore(targetSum / answeredCount);
const gapAvg = calculateGap(targetAvg, currentAvg);
  
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return {
    currentAvg,
    targetAvg,
    gapAvg,
    answeredCount,
    totalCount,
    progress,
    currentSum,
    targetSum,
  };
}

export function computeOverallSummary(
  definition: AssessmentDefinition,
  scores: ReadinessState['scores'],
  touched: ReadinessState['touched'],
  completion: ReadinessState['completion']
): OverallScoreSummary {
  let totalCurrentSum = 0;
  let totalTargetSum = 0;
  let completedDimensions = 0;
  let totalAnsweredQuestions = 0;
  let totalQuestions = 0;

  const definitions = definition.dimensions;
  
  definitions.forEach((dim) => {
    const dimScores = scores[dim.id] || {};
    const dimTouched = touched[dim.id] || {};
    const summary = computeDimensionSummary(dim, dimScores, dimTouched);
    
    totalAnsweredQuestions += summary.answeredCount;
    totalQuestions += summary.totalCount;

    // Accumulate sums directly for weighted average
    totalCurrentSum += summary.currentSum;
    totalTargetSum += summary.targetSum;

    if (completion[dim.id]) {
      completedDimensions++;
    }
  });

  const totalDimensions = definitions.length;
  
  const confidenceRatio = totalQuestions > 0 
    ? Math.round((totalAnsweredQuestions / totalQuestions) * 100) / 100
    : 0;

  if (totalAnsweredQuestions === 0) {
    return {
      currentAvg: 0,
      targetAvg: 0,
      gapAvg: 0,
      completedDimensions,
      totalDimensions,
      confidenceRatio: 0,
    };
  }

  // Overall weighted average = Total Sum / Total Answered Questions
  const currentAvg = normalizeScore(totalCurrentSum / totalAnsweredQuestions);
  const targetAvg = normalizeScore(totalTargetSum / totalAnsweredQuestions);
const gapAvg = calculateGap(targetAvg, currentAvg);

  return {
    currentAvg,
    targetAvg,
    gapAvg,
    completedDimensions,
    totalDimensions,
    confidenceRatio,
  };
}

export function computeResultsModel(
  definition: AssessmentDefinition,
  scores: ReadinessState['scores'],
  touched: ReadinessState['touched'],
  completion: ReadinessState['completion']
): EnhancedResultsModel {
  const overall = computeOverallSummary(definition, scores, touched, completion);
  
  const dimensions: DimensionResultModel[] = [];
  const allGaps: TopGapModel[] = [];

  definition.dimensions.forEach((dim) => {
    const dimScores = scores[dim.id] || {};
    const dimTouched = touched[dim.id] || {};
    const summary = computeDimensionSummary(dim, dimScores, dimTouched);
    const isComplete = !!completion[dim.id];

    dimensions.push({
      id: dim.id,
      title: dim.title,
      currentAvg: summary.currentAvg,
      targetAvg: summary.targetAvg,
      gapAvg: summary.gapAvg,
      answeredCount: summary.answeredCount,
      totalCount: summary.totalCount,
      progress: summary.progress,
      isComplete,
    });

    // Collect gaps - ONLY for touched topics
    dim.topics.forEach(topic => {
      const isTouched = dimTouched[topic.id];
      if (isTouched) {
        const score = dimScores[topic.id];
        if (score) {
            const current = normalizeScore(score.current);
            const target = normalizeScore(score.target);
            const gap = calculateGap(target, current);
            if (gap > 0) {
                allGaps.push({
                dimensionId: dim.id,
                dimensionTitle: dim.title,
                topicId: topic.id,
                topicLabel: topic.label,
                current: current,
                target: target,
                gap: gap,
                });
            }
        }
      }
    });
  });

  // Sort gaps descending by gap size
  const topGaps = allGaps
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  // Enhanced analytics
  const dimensionComparisons = computeDimensionComparisons(dimensions);
  const topTopics = computeTopTopics(definition, scores, touched);
  const overallGap = roundToStep(overall.targetAvg - overall.currentAvg, 0.1);

  return {
    overall,
    dimensions,
    topGaps,
    dimensionComparisons,
    topTopics,
    overallGap,
    maturityTrend: 'stable',
  };
}

export function getNextIncompleteDimensionId(
  definition: AssessmentDefinition,
  completion: ReadinessState['completion']
): string | null {
  const incompleteDim = definition.dimensions.find(d => !completion[d.id]);
  return incompleteDim ? incompleteDim.id : null;
}

// ---------------------------------------------------------------------------
// Enhanced Analytics
// ---------------------------------------------------------------------------

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSquares = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  return Math.sqrt(sumSquares / values.length);
}

function determineTrend(
  current: number,
  target: number,
  variance: number
): 'positive' | 'negative' | 'neutral' {
  const gap = target - current;
  if (gap > 0.5 && variance < 0.5) return 'positive';
  if (gap < -0.5 || variance > 1.0) return 'negative';
  return 'neutral';
}

/** Multi-factor priority: 40% gap size, 30% target importance, 30% current weakness. */
export function calculatePriorityScore(current: number, target: number, gap: number): number {
  // Gap is already clamped to >= 0 by calculateGap
  const gapWeight = gap * 0.40;
  const targetWeight = (target / 5) * 0.30;
  const currentWeight = ((5 - current) / 5) * 0.30;
  // Ensure non-negative priority
  return roundToStep(Math.max(0, gapWeight + targetWeight + currentWeight), 0.1);
}

function determineRiskLevel(current: number, gap: number): 'high' | 'medium' | 'low' {
  // Gap is clamped >= 0
  if (current <= 2.0 || gap >= 2.0) return 'high';
  if (current <= 3.5 || gap >= 1.0) return 'medium';
  return 'low';
}

/** Build dimension-level gap analysis from DimensionResultModel[]. */
export function computeDimensionComparisons(
  dimensions: DimensionResultModel[]
): DimensionComparison[] {
  return dimensions.map(dim => {
    const gap = calculateGap(dim.targetAvg, dim.currentAvg);
    const gapPercentage = roundToStep((Math.abs(gap) / 5) * 100, 0.1);
    // Variance across topic-level scores is approximated from the dimension averages
    // (we don't have per-topic scores here, so variance defaults to 0 — trend uses gap only)
    const variance = 0;
    return {
      id: dim.id,
      name: dim.title,
      current: dim.currentAvg,
      target: dim.targetAvg,
      gap,
      gapPercentage,
      variance,
      trend: determineTrend(dim.currentAvg, dim.targetAvg, variance),
    };
  }).sort((a, b) => b.gap - a.gap);
}

/** Rank all touched topics by multi-factor priority. */
export function computeTopTopics(
  definition: AssessmentDefinition,
  scores: ReadinessState['scores'],
  touched: ReadinessState['touched'],
  limit = 10
): TopTopic[] {
  const topics: TopTopic[] = [];

  definition.dimensions.forEach(dim => {
    const dimScores = scores[dim.id] || {};
    const dimTouched = touched[dim.id] || {};

    dim.topics.forEach(topic => {
      if (!dimTouched[topic.id]) return;
      const score = dimScores[topic.id];
      if (!score) return;

      const current = normalizeScore(score.current);
      const target = normalizeScore(score.target);
      const gap = calculateGap(target, current);
      const priorityScore = calculatePriorityScore(current, target, gap);

      topics.push({
        id: topic.id,
        label: topic.label,
        dimensionId: dim.id,
        dimensionName: dim.title,
        current,
        target,
        gap,
        priorityScore,
        riskLevel: determineRiskLevel(current, gap),
        impactArea: dim.title,
      });
    });
  });

  return topics
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);
}
