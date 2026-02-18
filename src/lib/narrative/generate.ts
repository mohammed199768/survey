// import { localSource } from '../content/localSource';
import { OrganizationMaturity } from '../maturity/model';
import { OverallScoreSummary, TopGapModel, EnhancedResultsModel, DimensionComparison } from '../scoring/compute';
// import { RecommendationsModel, RecommendationResult } from '../recommendations/engine'; // REMOVED
// ... actually we just need EnhancedRecommendation now

import type { NarrativeDefinition } from '../api/types';
import { EnhancedRecommendation } from '../recommendations/definition';

/**
 * Replace placeholders in template string with values from vars.
 * @param template "Hello {name}"
 * @param vars { name: "World" }
 * @returns "Hello World"
 */
function formatTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

function buildHeadline(def: NarrativeDefinition, maturity: OrganizationMaturity): string {
  if (!def.headlines || !def.headlines.byStageId) return `Assessment Complete: ${maturity.stage.label}`;

  const stageId = maturity.stage.id;
  const isLowConfidence = maturity.confidenceLabel === 'Low';

  if (isLowConfidence) {
    const prefix = formatTemplate(def.headlines.lowConfidencePrefix, {
      stageLabel: maturity.stage.label
    });
    return `${prefix} potential`;
  }
  
  const template = def.headlines.byStageId[stageId] || def.headlines.byStageId.default;
  return formatTemplate(template, {
      stageLabel: maturity.stage.label
  });
}

function buildNotes(def: NarrativeDefinition, maturity: OrganizationMaturity): string[] {
  const notes: string[] = [];
  if (!def.notes) return notes;
  
  if (maturity.confidenceRatio < 0.4) {
      notes.push(def.notes.low || 'Confidence is low.');
  } else if (maturity.confidenceRatio < 0.7) {
      notes.push(def.notes.moderate || 'Confidence is moderate.');
  }
  return notes;
}

function buildStageRationale(def: NarrativeDefinition, maturity: OrganizationMaturity, overall: OverallScoreSummary): string {
  let rationale = "";
  if (def.stageRationale) {
      rationale = formatTemplate(def.stageRationale, {
          currentAvg: overall.currentAvg.toFixed(1),
          confidenceLabel: maturity.confidenceLabel.toLowerCase(),
          confidenceRatio: (maturity.confidenceRatio * 100).toFixed(0)
      });
  } else {
      rationale = `This stage determination reflects a calculated aggregate score of ${overall.currentAvg.toFixed(1)}.`;
  }
  
  if (maturity.downgradeReason) {
      rationale += ` Note: ${maturity.downgradeReason}`;
  }
  return rationale;
}

export type NarrativeModel = {
  headline: string;
  executiveSummary: string;
  stageRationale: string;
  priorities: Array<{ title: string; why: string }>;
  quickWins: string[];
  notes: string[];
};

export function generateNarrative(args: {
  maturity: OrganizationMaturity;
  overall: OverallScoreSummary;
  topGaps: TopGapModel[];
  recommendations: EnhancedRecommendation[];
  definition: NarrativeDefinition;
}): NarrativeModel {
  const { maturity, overall, topGaps, recommendations, definition: def } = args;
  // const def = localSource.getNarrative(); // REMOVED

  // 0. Helpers & Maps
  const getThemeLabel = (tags: string[] = []): string => {
      for (const t of tags) {
          if (def.themeMap[t]) return def.themeMap[t];
      }
      return "General Capability";
  };

  const getDimensionTitle = (id: string): string => {
      const found = topGaps.find(g => g.dimensionId === id);
      return found ? found.dimensionTitle : id.charAt(0).toUpperCase() + id.slice(1);
  };

  // 1. Headline
  const headline = buildHeadline(def, maturity);

  // 2. Theme & Executive Summary
  // Derive theme from most frequent tag in top 5 recs
  const tagCounts: Record<string, number> = {};
  const top5Recs = recommendations.slice(0, 5);
  top5Recs.forEach(r => {
      if (r.tags) r.tags.forEach(t => {
          const label = def.themeMap[t] || t;
          tagCounts[label] = (tagCounts[label] || 0) + 1;
      });
  });
  
  // Find max tag
  let topTheme = '';
  let maxCount = 0;
  Object.entries(tagCounts).forEach(([theme, count]) => {
      if (count > maxCount) {
          maxCount = count;
          topTheme = theme;
      }
  });

  // Fallback if no tags
  if (!topTheme) {
      topTheme = topGaps.length > 0 ? topGaps[0].dimensionTitle : 'General Readiness';
  }

  // Clean strings construction
  let executiveSummary = "";
  if (def.executiveSummary) {
      const sentence1 = formatTemplate(def.executiveSummary.sentence1, {
          stageLabel: maturity.stage.label,
          currentAvg: overall.currentAvg.toFixed(1)
      });
          
      const sentence2 = formatTemplate(def.executiveSummary.sentence2, {
          topTheme: topTheme.toLowerCase()
      });
          
      const sentence3 = formatTemplate(def.executiveSummary.sentence3, {
          gapAvg: overall.gapAvg.toFixed(1)
      });

      executiveSummary = [sentence1, sentence2, sentence3].join(' ');
  } else {
      executiveSummary = `The organization is at the ${maturity.stage.label} stage with a score of ${overall.currentAvg.toFixed(1)}.`;
  }

  // 3. Stage Rationale
  const rationale = buildStageRationale(def, maturity, overall);

  // 4. Priorities (Dedupe by Theme)
  const priorities: Array<{ title: string; why: string }> = [];
  const startRecs = recommendations; // Was recommendations.recommendations 
  const seenThemes = new Set<string>();

  for (const rec of startRecs) {
    if (priorities.length >= 3) break;
    
    const theme = getThemeLabel(rec.tags);
    const dimTitle = getDimensionTitle(rec.dimension);
    
    // Construct "why" using template
    const whyTemplate = def.priorityWhyTemplate || "Closes a +{gap} gap in {dimensionTitle} by targeting {theme}.";
    const why = formatTemplate(whyTemplate, {
        gap: (rec.gap || 0).toFixed(1),
        dimensionTitle: dimTitle,
        theme: theme
    });

    if (!seenThemes.has(theme)) {
        seenThemes.add(theme);
        priorities.push({
            title: rec.title,
            why
        });
    }
  }

  // Fallback if not enough themes found
  if (priorities.length < 3) {
      const seenTitles = new Set(priorities.map(p => p.title));
      for (const rec of startRecs) {
          if (priorities.length >= 3) break;
          if (!seenTitles.has(rec.title)) {
              seenTitles.add(rec.title);
              const theme = getThemeLabel(rec.tags);
              const dimTitle = getDimensionTitle(rec.dimension);
              
              const whyTemplate = def.priorityWhyTemplate || "Closes a +{gap} gap in {dimensionTitle} by targeting {theme}.";
              const why = formatTemplate(whyTemplate, {
                  gap: (rec.gap || 0).toFixed(1),
                  dimensionTitle: dimTitle,
                  theme: theme
              });
                  
              priorities.push({ title: rec.title, why });
          }
      }
  }
  
  // Last fallback to gaps
  if (priorities.length < 3) {
    topGaps.forEach(gap => {
        if (priorities.length >= 3) return;
        const title = `Strengthen ${gap.topicLabel}`; 
        const exists = priorities.some(p => p.title === title);
        if (!exists) {
             priorities.push({
                title: title,
                why: `Critical gap of ${gap.gap.toFixed(1)} in ${gap.dimensionTitle}.`
            });
        }
    });
  }

  // 5. Quick Wins (Distinct Themes preferred)
  const quickWins: string[] = [];
  const winsSeenActions = new Set<string>();
  const winsSeenThemes = new Set<string>();

  // Pass 1: Distinct themes
  for (const rec of startRecs) {
      if (quickWins.length >= 5) break; 
      const action = rec.actions && rec.actions.length > 0 ? rec.actions[0] : rec.title;
      const theme = getThemeLabel(rec.tags);

      if (!winsSeenThemes.has(theme) && !winsSeenActions.has(action)) {
          winsSeenThemes.add(theme);
          winsSeenActions.add(action);
          quickWins.push(action);
      }
  }

  // Pass 2: Fill rest
  if (quickWins.length < 5) {
      for (const rec of startRecs) {
        if (quickWins.length >= 5) break;
        const action = rec.actions && rec.actions.length > 0 ? rec.actions[0] : rec.title;
        if (!winsSeenActions.has(action)) {
            winsSeenActions.add(action);
            quickWins.push(action);
        }
      }
  }

  // 6. Notes
  const notes = buildNotes(def, maturity);

  return {
    headline,
    executiveSummary,
    stageRationale: rationale,
    priorities,
    quickWins,
    notes
  };
}

// ---------------------------------------------------------------------------
// Standalone Executive Summary (no recommendations/maturity pipeline needed)
// ---------------------------------------------------------------------------

type MaturityLevelKey = 'leading' | 'advanced' | 'ready' | 'exploring' | 'beginner';

function getMaturityLevelKey(score: number, thresholds: Record<string, number>): MaturityLevelKey {
  if (score >= thresholds.leading) return 'leading';
  if (score >= thresholds.advanced) return 'advanced';
  if (score >= thresholds.ready) return 'ready';
  if (score >= thresholds.exploring) return 'exploring';
  return 'beginner';
}

/**
 * Generate a short executive summary from enhanced results.
 */
export function generateExecutiveSummary(results: EnhancedResultsModel, def: NarrativeDefinition): string {
  const { overall, dimensionComparisons, topTopics } = results;
  // const def = localSource.getNarrative(); // REMOVED
  const templates = def.executiveTemplates;
  const thresholds = def.maturityThresholds;

  // 1. Maturity statement
  const levelKey = getMaturityLevelKey(overall.currentAvg, thresholds);
  let maturityStatement = templates.maturityLevel[levelKey]
    .replace('{score}', overall.currentAvg.toFixed(1));

  // 2. Gap statement
  const largeGaps = dimensionComparisons.filter(d => Math.abs(d.gap) > 1.0);
  let gapStatement = '';
  
  if (largeGaps.length > 2) {
    gapStatement = templates.gapAnalysis.large
        .replace('{count}', largeGaps.length.toString())
        .replace('{pluralS}', 's')
        .replace('{dimensions}', largeGaps.slice(0, 3).map(d => d.name).join(', '))
        .replace('{verbS}', '');
  } else if (largeGaps.length > 0) {
      gapStatement = templates.gapAnalysis.moderate
        .replace('{count}', largeGaps.length.toString())
        .replace('{pluralS}', largeGaps.length > 1 ? 's' : '')
        .replace('{verbS}', largeGaps.length > 1 ? ' show' : ' shows');
  } else {
      gapStatement = templates.gapAnalysis.minimal;
  }

  // 3. Strengths
  const strengths = dimensionComparisons.filter(d => d.current >= 4.0);
  let strengthStatement = '';
  if (strengths.length > 1) {
    const list = strengths.slice(0, -1).map(s => s.name).join(', ');
    const last = strengths[strengths.length - 1].name;
    strengthStatement = templates.strengths.multiple
        .replace('{list}', list)
        .replace('{lastItem}', last);
  } else if (strengths.length === 1) {
    strengthStatement = templates.strengths.single
        .replace('{area}', strengths[0].name);
  }

  // 4. Priorities
  let priorityStatement = '';
  if (topTopics.length >= 3) {
      const topicList = topTopics.slice(0, 3).map(t => t.label).join(', ');
      priorityStatement = templates.priorities.high.replace('{topics}', topicList);
  } else {
      priorityStatement = templates.priorities.balanced;
  }

  return [maturityStatement, strengthStatement, gapStatement, priorityStatement]
    .filter(Boolean)
    .join(' ');
}
