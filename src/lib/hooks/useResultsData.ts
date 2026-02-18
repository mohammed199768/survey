'use client';

import * as React from 'react';
import { ResponseAPI } from '@/lib/api/endpoints';
import { ResultsData } from '@/lib/api/types';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { DimensionResultModel, OverallScoreSummary, TopGapModel, TopTopic } from '@/lib/scoring/compute';
import { getOrganizationMaturity } from '@/lib/maturity/model';
import { generateRecommendationsFromAPI } from '@/lib/recommendations/apiEngine';
import { generateNarrative } from '@/lib/narrative/generate';

interface UseResultsDataOptions {
  initialResults: ResultsData | null;
  initialError: string | null;
  responseIdFromQuery: string | null;
}

export function useResultsData({
  initialResults,
  initialError,
  responseIdFromQuery,
}: UseResultsDataOptions) {
  const storeResponseId = useReadinessStore((state) => state.responseId);
  const assessment = useReadinessStore((state) => state.assessment);
  const loadAssessment = useReadinessStore((state) => state.loadAssessment);
  const recommendationsDefinition = useReadinessStore((state) => state.recommendationsDefinition);
  const narrativeDefinition = useReadinessStore((state) => state.narrativeDefinition);
  const loadDefinitions = useReadinessStore((state) => state.loadDefinitions);
  const responses = useReadinessStore((state) => state.responses);

  const responseId = responseIdFromQuery ?? storeResponseId;
  const [results, setResults] = React.useState<ResultsData | null>(initialResults);
  const [error, setError] = React.useState<string | null>(initialError);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialResults);

  React.useEffect(() => {
    if (!recommendationsDefinition || !narrativeDefinition) {
      loadDefinitions();
    }

    if (!assessment) {
      loadAssessment();
    }
  }, [assessment, loadAssessment, loadDefinitions, narrativeDefinition, recommendationsDefinition]);

  React.useEffect(() => {
    if (initialResults) {
      return;
    }

    if (!responseId) {
      setIsLoading(false);
      setError('Missing response id');
      return;
    }

    const fetchResults = async () => {
      try {
        setError(null);
        const data = await ResponseAPI.getResults(responseId);
        setResults(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load results';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [initialError, initialResults, responseId]);

  const dimensionModels: DimensionResultModel[] = React.useMemo(() => {
    if (!results) return [];
    return results.dimensions.map((d) => ({
      id: d.dimensionKey,
      title: d.title,
      currentAvg: d.score,
      targetAvg: d.score + d.gap,
      gapAvg: d.gap,
      answeredCount: 0,
      totalCount: 0,
      progress: 100,
      isComplete: true,
    }));
  }, [results]);

  const topTopics: TopTopic[] = React.useMemo(() => {
    if (!results) return [];

    return results.topGaps.map((g) => {
      const resp = responses[g.topicId];
      const target = resp?.target ?? 0;
      const dim = results.dimensions.find((d) => d.title === g.dimensionTitle);
      const dimensionId = dim?.dimensionKey ?? '';

      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      let impactArea = 'Low';
      if (g.gap >= 1.5) {
        riskLevel = 'high';
        impactArea = 'High';
      } else if (g.gap >= 0.5) {
        riskLevel = 'medium';
        impactArea = 'Medium';
      }

      return {
        id: g.topicId,
        label: g.label,
        dimensionName: g.dimensionTitle,
        dimensionId,
        riskLevel,
        target,
        gap: g.gap,
        current: resp?.current ?? 0,
        priorityScore: g.gap,
        impactArea,
      };
    });
  }, [responses, results]);

  const narrative = React.useMemo(() => {
    if (!results || !narrativeDefinition || !recommendationsDefinition) return null;

    try {
      const maturity = getOrganizationMaturity({
        overallCurrentAvg: results.overallScore,
        confidenceRatio: 1,
      });

      const overall: OverallScoreSummary = {
        currentAvg: results.overallScore,
        targetAvg: results.overallScore + results.overallGap,
        gapAvg: results.overallGap,
        completedDimensions: results.dimensions.length,
        totalDimensions: results.dimensions.length,
        confidenceRatio: 1,
      };

      const topGapsModels: TopGapModel[] = results.topGaps.map((g) => {
        const dim = results.dimensions.find((d) => d.title === g.dimensionTitle);
        return {
          topicId: g.topicId,
          topicLabel: g.label,
          gap: g.gap,
          dimensionId: dim?.dimensionKey ?? '',
          dimensionTitle: g.dimensionTitle,
          current: 0,
          target: 0,
        };
      });

      const recommendations = generateRecommendationsFromAPI(results, recommendationsDefinition);

      return generateNarrative({
        maturity,
        overall,
        topGaps: topGapsModels,
        recommendations,
        definition: narrativeDefinition,
      });
    } catch {
      return null;
    }
  }, [narrativeDefinition, recommendationsDefinition, results]);

  return {
    error,
    isLoading,
    narrative,
    responseId,
    results,
    dimensionModels,
    topTopics,
  };
}
