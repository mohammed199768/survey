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

type ResultsErrorVariant = {
  badge: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryAction: 'survey' | 'home' | 'retry';
};

const parseApiStatus = (message: string): number | null => {
  const match = message.match(/API Error:\s*(\d{3})/i);
  if (!match) return null;
  const status = Number(match[1]);
  return Number.isFinite(status) ? status : null;
};

const getErrorVariant = (errorMessage: string | null, hasResults: boolean): ResultsErrorVariant => {
  if (!errorMessage && !hasResults) {
    return {
      badge: 'No Data',
      title: 'No Results Found',
      description: 'We could not find result data for this request.',
      primaryLabel: 'Start Survey',
      primaryAction: 'survey',
    };
  }

  if ((errorMessage || '').toLowerCase().includes('missing response id')) {
    return {
      badge: 'Missing Session',
      title: 'Assessment Session Not Found',
      description: 'No response identifier was provided. Start or resume a survey session first.',
      primaryLabel: 'Open Survey',
      primaryAction: 'survey',
    };
  }

  const status = errorMessage ? parseApiStatus(errorMessage) : null;

  if (status === 404) {
    return {
      badge: 'Error 404',
      title: 'Results Not Found',
      description: 'This results record is missing or no longer available.',
      primaryLabel: 'Start New Survey',
      primaryAction: 'survey',
    };
  }

  if (status === 401 || status === 403) {
    return {
      badge: `Error ${status}`,
      title: 'Access Restricted',
      description: 'Your current session cannot access these results. Please reopen from an active survey session.',
      primaryLabel: 'Go To Survey',
      primaryAction: 'survey',
    };
  }

  if (typeof status === 'number' && status >= 500) {
    return {
      badge: `Error ${status}`,
      title: 'Server Temporarily Unavailable',
      description: 'The server could not process this request right now. Please retry.',
      primaryLabel: 'Try Again',
      primaryAction: 'retry',
    };
  }

  return {
    badge: 'Request Error',
    title: 'Unable To Load Results',
    description: 'An unexpected error occurred while loading your results.',
    primaryLabel: 'Try Again',
    primaryAction: 'retry',
  };
};

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
    const variant = getErrorVariant(error, !!results);
    const handlePrimary = () => {
      if (variant.primaryAction === 'survey') {
        router.push('/survey');
        return;
      }

      if (variant.primaryAction === 'home') {
        router.push('/');
        return;
      }

      router.refresh();
    };

    return (
      <div className="brand-theme min-h-screen bg-[radial-gradient(1200px_500px_at_78%_-140px,#eaf4ff_0%,#f5f7fa_55%,#f2f4f8_100%)] font-sans flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-[28px] bg-white/95 border border-[#b6d5eb] shadow-[0_24px_60px_rgba(15,23,42,0.12)] px-6 py-10 sm:px-10 sm:py-12 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold text-[#3a92c6]">{variant.badge}</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0F3F52]">{variant.title}</h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">{variant.description}</p>
          {error ? <p className="mt-3 text-xs text-slate-500 break-words">{error}</p> : null}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button onClick={handlePrimary} className="brand-btn w-full sm:w-auto px-8 py-3 text-sm">
              {variant.primaryLabel}
            </button>
            <button onClick={() => router.push('/')} className="brand-btn-outline w-full sm:w-auto px-8 py-3 text-sm">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallTargetScore = results.overallScore + results.overallGap;
  const recommendationsUrl = responseId
    ? `/results/recommendations?responseId=${encodeURIComponent(responseId)}`
    : '/results/recommendations';

  return (
    <div className="brand-theme min-h-screen bg-[#f9fafb] font-sans overflow-x-hidden">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8">
          <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Overall Assessment Score</h3>
            <p className="text-xs text-gray-500 mb-6">Executive KPI</p>
            <MaturityGauge score={results.overallScore} targetScore={overallTargetScore} title="Overall Assessment Score" />
          </div>

          <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
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

          <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Top Topics</h3>
              <span className="text-xs font-medium text-gray-500">Score / Target</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <TopTopicsList topics={topTopics} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push('/survey')}
              className="brand-btn-outline px-4 sm:px-8 py-3"
            >
              Previous
            </button>
            <ResetButton />
          </div>

          <button
            onClick={() => router.push(recommendationsUrl)}
            className="px-8 sm:px-10 lg:px-12 py-2.5 bg-[#3a92c6] text-white rounded-full text-sm sm:text-base font-semibold text-center cursor-pointer transition-all duration-300 hover:bg-[#54a5d5] focus:ring-2 focus:ring-[#3a92c6] focus:ring-offset-2 focus:ring-offset-white shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            See Recommendations
          </button>
        </div>
      </main>
    </div>
  );
}
