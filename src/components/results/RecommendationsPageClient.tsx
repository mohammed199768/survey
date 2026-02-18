'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { ResponseAPI } from '@/lib/api/endpoints';
import { ResultsData } from '@/lib/api/types';
import { generateBubbleData } from '@/lib/recommendations/apiEngine';
import { BubbleChart } from './charts/BubbleChart';
import { RecommendationsList } from './RecommendationsList';
import { Navbar } from '@/components/layout/Navbar';
import { ResetButton } from '@/components/common/ResetButton';
import { EnhancedRecommendation } from '@/lib/recommendations/definition';
import { FullPagePreloader } from '@/components/common/BrandPreloader';

interface RecommendationsPageClientProps {
  initialResults: ResultsData | null;
  responseIdFromQuery: string | null;
}

const DEFAULT_COLORS = ['#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#1d4ed8', '#f97316'];

const clamp10 = (value: number) => Math.max(0, Math.min(10, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

const computeMetrics = (score: number, target: number, gap: number) => {
  const gapRatio = gap / 4;
  const gapUrgency = gapRatio * 10;
  const maturityUrgency = ((5 - score) / 4) * 10;
  const urgency = clamp10(round1(gapUrgency * 0.6 + maturityUrgency * 0.4));

  const importance = clamp10(round1((target / 5) * 10));

  let complexityBase = 0.3;
  if (score < 2.0 && gap > 2.0) complexityBase = 0.9;
  else if (score < 3.0 && gap > 1.5) complexityBase = 0.7;
  else if (gap > 1.0) complexityBase = 0.5;

  const complexity = clamp10(round1(complexityBase * 10));
  const resourceNeed = clamp10(round1((gap * 0.5 + complexityBase * 0.5) * 2.5));

  let timeframe: 'immediate' | 'short' | 'medium' | 'long' = 'medium';
  if (urgency > 8 && resourceNeed < 6) timeframe = 'immediate';
  else if (urgency > 6) timeframe = 'short';
  else if (resourceNeed > 7) timeframe = 'long';

  return { urgency, importance, resourceNeed, complexity, timeframe };
};

export function RecommendationsPageClient({ initialResults, responseIdFromQuery }: RecommendationsPageClientProps) {
  const router = useRouter();
  const definition = useReadinessStore((state) => state.assessment);
  const responses = useReadinessStore((state) => state.responses);
  const storeResponseId = useReadinessStore((state) => state.responseId);
  const responseId = responseIdFromQuery ?? storeResponseId;
  const loadAssessment = useReadinessStore((state) => state.loadAssessment);

  const [selectedBubbleRank, setSelectedBubbleRank] = React.useState<number | null>(null);
  const [highlightedDimension, setHighlightedDimension] = React.useState<string | null>(null);
  const [apiResults, setApiResults] = React.useState<ResultsData | null>(initialResults);
  const [loading, setLoading] = React.useState(!initialResults);

  React.useEffect(() => {
    if (!definition) loadAssessment();
  }, [definition, loadAssessment]);

  React.useEffect(() => {
    if (initialResults) {
      setLoading(false);
      return;
    }

    async function fetchResults() {
      if (!responseId) {
        setLoading(false);
        return;
      }
      try {
        const data = await ResponseAPI.getResults(responseId);
        setApiResults(data);
      } catch (e) {
        console.error('Failed to fetch results:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [initialResults, responseId]);

  const dimensionColorByKey = React.useMemo(() => {
    const map = new Map<string, string>();
    (apiResults?.dimensions || []).forEach((dimension, idx) => {
      map.set(dimension.dimensionKey, DEFAULT_COLORS[idx % DEFAULT_COLORS.length]);
    });
    return map;
  }, [apiResults]);

  const legendItems = React.useMemo(
    () =>
      (apiResults?.dimensions || []).map((dimension, idx) => ({
        id: dimension.dimensionKey,
        name: dimension.title,
        color: dimensionColorByKey.get(dimension.dimensionKey) || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      })),
    [apiResults, dimensionColorByKey]
  );

  const recommendations = React.useMemo<EnhancedRecommendation[]>(() => {
    if (!apiResults) return [];

    const flattened = apiResults.dimensions.flatMap((dimension) =>
      dimension.recommendations.map((rec) => {
        const score = dimension.score;
        const gap = dimension.gap;
        const target = score + gap;

        return {
          rec,
          dimensionKey: dimension.dimensionKey,
          score,
          gap,
          target,
          color: dimensionColorByKey.get(dimension.dimensionKey) || '#666666',
        };
      })
    );

    let prioritized = [...flattened];
    if (apiResults.topRecommendations.length > 0) {
      const topKeyToRank = new Map<string, number>();
      apiResults.topRecommendations.forEach((topRec, idx) => {
        topKeyToRank.set(`${topRec.id}:${topRec.topicId}`, idx);
      });

      prioritized.sort((a, b) => {
        const aRank = topKeyToRank.get(`${a.rec.id}:${a.rec.topicId}`);
        const bRank = topKeyToRank.get(`${b.rec.id}:${b.rec.topicId}`);

        const aInTop = typeof aRank === 'number';
        const bInTop = typeof bRank === 'number';
        if (aInTop && bInTop) {
          return (aRank as number) - (bRank as number);
        }
        if (aInTop) return -1;
        if (bInTop) return 1;
        return b.rec.priority - a.rec.priority;
      });
    } else {
      prioritized.sort((a, b) => b.rec.priority - a.rec.priority);
    }

    return prioritized
      .map(({ rec, dimensionKey, score, gap, target, color }, index) => ({
        id: rec.id,
        rank: index + 1,
        title: rec.title,
        description: rec.description || '',
        dimension: dimensionKey,
        category: rec.category,
        metrics: computeMetrics(score, target, gap),
        color,
        topics: [rec.topicId],
        tags: rec.tags,
        actions: rec.actionItems,
        gap,
        priority: rec.priority,
        why: rec.why || undefined,
        what: rec.what || undefined,
        how: rec.how || undefined,
      }));
  }, [apiResults, dimensionColorByKey]);

  const bubbleData = React.useMemo(() => generateBubbleData(recommendations), [recommendations]);

  const handleBubbleClick = React.useCallback((rank: number) => {
    setSelectedBubbleRank(rank);
    setHighlightedDimension(null);
    const el = document.getElementById(`recommendation-${rank}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleLegendClick = React.useCallback((dimensionId: string) => {
    setHighlightedDimension((prev) => (prev === dimensionId ? null : dimensionId));
    setSelectedBubbleRank(null);
  }, []);

  if (loading || !definition) {
    return <FullPagePreloader label="Loading recommendations..." />;
  }

  if (Object.keys(responses).length === 0 && !apiResults) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assessment Data</h2>
          <p className="text-gray-600 mb-6">Please complete the survey first.</p>
          <button
            onClick={() => router.push('/survey')}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            Start Survey
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Recommendations Available</h2>
          <p className="text-gray-600 mb-6">
            Unable to generate recommendations. Please ensure you have completed the assessment.
          </p>
          <button
            onClick={() =>
              router.push(responseId ? `/results?responseId=${encodeURIComponent(responseId)}` : '/results')
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-theme min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar showBackButton backUrl="/results" />

      <main className="pt-24 pb-12 px-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Recommendations &amp; Priority Matrix</h1>
          <p className="text-gray-500 text-sm">
            Strategic recommendations based on your assessment results
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-2">
            <BubbleChart
              bubbles={bubbleData}
              overallScore={apiResults?.overallScore || 0}
              legendItems={legendItems}
              selectedRank={selectedBubbleRank}
              highlightedDimension={highlightedDimension}
              onBubbleClick={handleBubbleClick}
              onLegendClick={handleLegendClick}
            />
          </div>

          <div className="lg:col-span-3">
            <RecommendationsList
              recommendations={recommendations}
              selectedRank={selectedBubbleRank}
              highlightedDimension={highlightedDimension}
              onRecommendationClick={setSelectedBubbleRank}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                router.push(responseId ? `/results?responseId=${encodeURIComponent(responseId)}` : '/results')
              }
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all"
            >
              Previous
            </button>
            <ResetButton />
          </div>

          <button
            onClick={() => alert('Download functionality coming soon!')}
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md"
          >
            Download Report
          </button>
        </div>
      </main>

      <div className="fixed bottom-6 left-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-50">
        CO
      </div>
    </div>
  );
}
