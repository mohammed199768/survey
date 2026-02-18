'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ResultsData } from '@/lib/api/types';
import { MaturityGauge } from './charts/MaturityGauge';
import { DimensionBarChart } from './charts/DimensionBarChart';
import { TopTopicsList } from './TopTopicsList';
import { Navbar } from '@/components/layout/Navbar';
import { ResetButton } from '@/components/common/ResetButton';
import { useResultsData } from '@/lib/hooks/useResultsData';
import { FullPagePreloader } from '@/components/common/BrandPreloader';

interface ResultsClientProps {
  initialResults: ResultsData | null;
  initialError: string | null;
  responseIdFromQuery: string | null;
}

export default function ResultsClient({
  initialResults,
  initialError,
  responseIdFromQuery,
}: ResultsClientProps) {
  const router = useRouter();
  const {
    error,
    isLoading,
    responseId,
    results,
    dimensionModels,
    topTopics,
  } = useResultsData({ initialResults, initialError, responseIdFromQuery });

  if (isLoading) {
    return <FullPagePreloader label="Loading results..." />;
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 font-medium mb-4">{error || 'No results found'}</div>
          <button onClick={() => router.push('/')} className="text-blue-600 underline">Return Home</button>
        </div>
      </div>
    );
  }

  const overallTargetScore = results.overallScore + results.overallGap;
  const recommendationsUrl = responseId
    ? `/results/recommendations?responseId=${encodeURIComponent(responseId)}`
    : '/results/recommendations';

  return (
    <div className="brand-theme min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar />

      <main className="pt-24 pb-12 px-12">
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-3 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Overall Assessment Score</h3>
            <p className="text-xs text-gray-500 mb-6">Executive KPI</p>
            <MaturityGauge score={results.overallScore} targetScore={overallTargetScore} title="Overall Assessment Score" />
          </div>

          <div className="col-span-5 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Assessment Results Overview</h3>
                <p className="text-xs text-gray-500">Dimension Breakdown</p>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Open chart options">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <DimensionBarChart dimensions={dimensionModels} />
          </div>

          <div className="col-span-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Top Topics</h3>
              <span className="text-xs font-medium text-gray-500">Score</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <TopTopicsList topics={topTopics} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/survey')}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all"
            >
              Previous
            </button>
            <ResetButton />
          </div>

          <button
            onClick={() => router.push(recommendationsUrl)}
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md"
          >
            See Recommendations
          </button>
        </div>
      </main>

      <div className="fixed bottom-6 left-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-50">
        CO
      </div>
    </div>
  );
}
