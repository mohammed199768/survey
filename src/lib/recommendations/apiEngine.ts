import { RecommendationsDefinitionAPI, ResultsData } from '@/lib/api/types';
import { EnhancedRecommendation, RecommendationMetrics, RecommendationBubble } from './definition';
import { roundToStep } from '@/lib/scoring/number';

/**
 * Generate recommendations from API definition based on results
 */
export function generateRecommendationsFromAPI(
  results: ResultsData,
  definition: RecommendationsDefinitionAPI
): EnhancedRecommendation[] {
  const recommendations: EnhancedRecommendation[] = [];
  const meta = definition.meta || {};
  const weights = meta.dimensionWeights || {};
  const colors = meta.dimensionColors || {};

  // Iterate through each dimension in results
  results.dimensions.forEach((dimResult) => {
    // Find matching dimension in definition
    const dimDef = definition.dimensions.find(
      d => d.dimensionKey === dimResult.dimensionKey
    );

    if (!dimDef) return;

    // Check each recommendation rule
    dimDef.recommendations.forEach((rule) => {
      const conditions = rule.conditions;
      
      const gap = dimResult.gap;
      const current = dimResult.score;
      // Target is not explicitly in dimResult but target = score + gap
      const target = current + gap; 

      // Check gap condition
      const matchesGap = 
        (!conditions.gapMin || gap >= conditions.gapMin) &&
        (!conditions.gapMax || gap <= conditions.gapMax);

      // Check maturity condition
      const matchesMaturity = 
        (!conditions.maturityBelow || current < conditions.maturityBelow) &&
        (!conditions.maturityAbove || current > conditions.maturityAbove);

      if (matchesGap && matchesMaturity) {
        // Calculate Metrics
        const dimWeight = weights[dimResult.dimensionKey] ?? 0.5;
        const metrics = calculateMetrics(current, target, gap, dimWeight);
        
        // Determine category (mapped from legacy tags if possible, or metrics)
        // If rule has explicit category tag like 'Quick Win', use it. Otherwise use metrics.
        let category: EnhancedRecommendation['category'] = 'Project';
        if (rule.tags?.includes('Quick Win')) category = 'Quick Win';
        else if (rule.tags?.includes('Big Bet')) category = 'Big Bet';
        else category = determineCategory(metrics);

        // Use rule.priority from API, fallback to computed priority if not available
        const priority = rule.priority ?? computeRankingPriority(metrics);

        recommendations.push({
          id: rule.id,
          rank: 0, // Assigned later
          title: rule.title,
          description: rule.description,
          dimension: dimResult.dimensionKey,
          category,
          metrics,
          color: colors[dimResult.dimensionKey] || '#64748b',
          topics: [], // API rules aren't strictly topic-bound in the same way, or we can use keys
          // Narrative fields
          why: rule.why,
          what: rule.what,
          how: rule.how,
          actions: rule.actionItems?.map(a => a.text) || [], 
          gap: gap,
          priority: priority, // Use rule.priority from API, or computed if not available
          tags: rule.tags || []
        });
      }
    });
  });

  // Sort by priority (highest first) and assign ranks
  return recommendations
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map((rec, index) => ({
      ...rec,
      rank: index + 1
    }));
}

/**
 * Generate bubble data for visualization
 */
export function generateBubbleData(recommendations: EnhancedRecommendation[]): RecommendationBubble[] {
  return recommendations.slice(0, 12).map((rec, index) => ({
    id: rec.id,
    rank: rec.rank,
    x: rec.metrics.urgency,
    y: rec.metrics.importance,
    size: normalizeBubbleSize(rec.metrics.resourceNeed),
    color: rec.color,
    label: String(rec.rank)
  }));
}

// ---------------------------------------------------------------------------
// Metrics Helpers (Ported from engine.ts)
// ---------------------------------------------------------------------------

function clamp10(v: number): number {
  return Math.max(0, Math.min(10, v));
}

function round1(v: number): number {
  return roundToStep(v, 0.1);
}

function calculateMetrics(
    current: number, 
    target: number, 
    gap: number, 
    dimensionWeight: number
): RecommendationMetrics {
  const gapRatio = gap / 4; // max gap is 4 (5-1)

  // URGENCY: gap size (60%) + low current maturity (40%)
  const gapUrgency = gapRatio * 10;
  const maturityUrgency = ((5 - current) / 4) * 10;
  const urgency = clamp10(round1(gapUrgency * 0.6 + maturityUrgency * 0.4));

  // IMPORTANCE: target ambition × dimension weight
  const targetAmbition = (target / 5) * 10;
  const importance = clamp10(round1(targetAmbition * dimensionWeight));

  // COMPLEXITY: larger gaps from lower maturity = higher complexity
  let complexityBase: number;
  if (current < 2.0 && gap > 2.0) complexityBase = 0.9;
  else if (current < 3.0 && gap > 1.5) complexityBase = 0.7;
  else if (gap > 1.0) complexityBase = 0.5;
  else complexityBase = 0.3;
  const complexity = clamp10(round1(complexityBase * 10));

  // RESOURCE NEED: gap size + complexity
  const resourceNeed = clamp10(round1((gap * 0.5 + complexityBase * 0.5) * 2.5));

  // TIMEFRAME
  let timeframe: RecommendationMetrics['timeframe'];
  if (urgency > 8 && resourceNeed < 6) timeframe = 'immediate';
  else if (urgency > 6) timeframe = 'short';
  else if (resourceNeed > 7) timeframe = 'long';
  else timeframe = 'medium';

  return { urgency, importance, resourceNeed, complexity, timeframe };
}

function determineCategory(m: RecommendationMetrics): EnhancedRecommendation['category'] {
  if (m.importance > 8 && m.resourceNeed > 7) return 'Big Bet';
  if (m.urgency > 7 && m.resourceNeed < 5) return 'Quick Win';
  return 'Project';
}

function computeRankingPriority(m: RecommendationMetrics): number {
  return round1(m.urgency * 0.50 + m.importance * 0.30 + (10 - m.resourceNeed) * 0.20);
}

function normalizeBubbleSize(resourceNeed: number): number {
  const minSize = 30;
  const maxSize = 70;
  return Math.round(minSize + (resourceNeed / 10) * (maxSize - minSize));
}
