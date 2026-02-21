// src/components/survey/DimensionContent.tsx

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopicCard } from '@/components/survey/TopicCard';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { AssessmentGateDialog } from '@/components/survey/AssessmentGateDialog';
import { AssessmentStructureResponse } from '@/lib/api/types';
import { BrandPreloader } from '@/components/common/BrandPreloader';
import { logger } from '@/lib/utils/logger';

type MissingItem = {
  dimensionId: string;
  dimensionTitle: string;
  topicId: string;
  topicLabel: string;
};

type ResponseMap = Record<string, { current: number; target: number }>;

const getMissingItemsFromStore = (
  assessment: AssessmentStructureResponse | null,
  responses: ResponseMap,
  pendingTopics: Set<string>
): MissingItem[] => {
  const missing: MissingItem[] = [];
  if (!assessment) return missing;

  assessment.dimensions.forEach((dim) => {
    dim.topics.forEach((topic) => {
      const isAnswered = !!responses[topic.id] && !pendingTopics.has(topic.id);
      if (!isAnswered) {
        missing.push({
          dimensionId: dim.dimensionKey,
          dimensionTitle: dim.title,
          topicId: topic.topicKey || topic.id,
          topicLabel: topic.label,
        });
      }
    });
  });
  return missing;
};

export function DimensionContent({ dimensionId }: { dimensionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicKeyParam = searchParams.get('topic');
  const [showCompletionDialog, setShowCompletionDialog] = React.useState(false);
  const [missingItems, setMissingItems] = React.useState<MissingItem[]>([]);

  const assessment = useReadinessStore((state) => state.assessment);
  const responses = useReadinessStore((state) => state.responses);
  const responseId = useReadinessStore((state) => state.responseId);
  const completeAssessment = useReadinessStore((state) => state.completeAssessment);
  const isLoading = useReadinessStore((state) => state.isLoading);
  const isSubmitting = useReadinessStore((state) => state.isSubmitting);
  const pendingTopics = useReadinessStore((state) => state.pendingTopics);

  const dimension = assessment?.dimensions.find((d) => d.dimensionKey === dimensionId);

  if (!assessment) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <BrandPreloader size={120} label="Loading dimension..." />
      </div>
    );
  }

  if (!dimension) {
    const firstDimension = assessment.dimensions[0];
    const firstTopic = firstDimension?.topics[0];
    const fallbackSurveyUrl =
      firstDimension && firstTopic
        ? `/survey/${firstDimension.dimensionKey}?topic=${firstTopic.topicKey}`
        : '/survey';

    return (
      <div className="relative z-10 flex min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-3.4rem)] flex-col px-4 sm:px-6 pt-4 pb-10 lg:ml-[344px] lg:mr-8 lg:mt-6 lg:h-[calc(100vh-5.9rem)] lg:min-h-0 lg:px-0 lg:pt-0 lg:pb-0">
        <div className="flex-1 min-h-[calc(100vh-6.6rem)] sm:min-h-[calc(100vh-7.2rem)] lg:min-h-0 overflow-hidden">
          <div
            className="bg-white/96 backdrop-blur-[1.5px] flex-1 min-h-[calc(100vh-6.6rem)] sm:min-h-[calc(100vh-7.2rem)] lg:min-h-0 flex items-center justify-center rounded-2xl lg:rounded-[32px]
                        shadow-[0_14px_34px_rgba(15,23,42,0.09),0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] lg:shadow-[0_24px_54px_rgba(15,23,42,0.12),0_6px_14px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]
                        border border-transparent relative min-w-0 px-4 sm:px-8"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-[#b6d5eb] bg-white px-6 py-8 sm:px-10 sm:py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#3a92c6]">Error 404</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#0F3F52]">Survey Section Not Found</h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                The requested dimension does not exist in the active assessment. Continue from the first available
                section.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => router.push(fallbackSurveyUrl)}
                  className="brand-btn w-full sm:w-auto px-8 py-3 text-sm"
                >
                  Go To Survey
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="brand-btn-outline w-full sm:w-auto px-8 py-3 text-sm"
                >
                  Return Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTopicIndex = dimension.topics.findIndex((t) => t.topicKey === topicKeyParam);
  const topicIndex = currentTopicIndex >= 0 ? currentTopicIndex : 0;
  const currentTopic = dimension.topics[topicIndex];

  const allDimensions = assessment.dimensions;
  const currentDimIndex = allDimensions.findIndex((d) => d.dimensionKey === dimensionId);

  const hasPrevious = topicIndex > 0 || currentDimIndex > 0;
  const isLastTopic = topicIndex === dimension.topics.length - 1 && currentDimIndex === allDimensions.length - 1;

  const handleNext = async () => {
    if (isLastTopic) {
      const missing = getMissingItemsFromStore(assessment, responses, pendingTopics);
      if (missing.length > 0) {
        setMissingItems(missing);
        setShowCompletionDialog(true);
      } else {
        try {
          await completeAssessment();
          const target = responseId ? `/results?responseId=${encodeURIComponent(responseId)}` : '/results';
          router.push(target);
        } catch (e) {
          logger.error('Completion failed', e);
        }
      }
      return;
    }
    if (topicIndex < dimension.topics.length - 1) {
      const targetTopic = dimension.topics[topicIndex + 1];
      router.push(`/survey/${dimension.dimensionKey}?topic=${targetTopic.topicKey}`);
    } else if (currentDimIndex < allDimensions.length - 1) {
      const nextDim = allDimensions[currentDimIndex + 1];
      const nextTopic = nextDim.topics[0];
      router.push(`/survey/${nextDim.dimensionKey}?topic=${nextTopic.topicKey}`);
    }
  };
  
  const handlePrevious = () => {
    if (topicIndex > 0) {
      const targetTopic = dimension.topics[topicIndex - 1];
      router.push(`/survey/${dimension.dimensionKey}?topic=${targetTopic.topicKey}`);
    } else if (currentDimIndex > 0) {
      const prevDim = allDimensions[currentDimIndex - 1];
      const prevTopic = prevDim.topics[prevDim.topics.length - 1];
      router.push(`/survey/${prevDim.dimensionKey}?topic=${prevTopic.topicKey}`);
    }
  };

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-3.4rem)] flex-col px-4 sm:px-6 pt-4 pb-28 lg:ml-[344px] lg:mr-8 lg:mt-6 lg:h-[calc(100vh-5.9rem)] lg:min-h-0 lg:px-0 lg:pt-0 lg:pb-0">
      {isSubmitting && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-[#1d6996] text-white text-xs px-3 py-1 rounded-full shadow-lg z-30 animate-pulse">
          Saving...
        </div>
      )}

      <div className="flex-1 min-h-[calc(100vh-6.6rem)] sm:min-h-[calc(100vh-7.2rem)] lg:min-h-0 overflow-x-auto overflow-y-auto lg:overflow-visible">
        <div
          className="bg-white/96 backdrop-blur-[1.5px] flex-1 min-h-[calc(100vh-6.6rem)] sm:min-h-[calc(100vh-7.2rem)] lg:min-h-0 flex flex-col rounded-2xl lg:rounded-[32px]
                      shadow-[0_14px_34px_rgba(15,23,42,0.09),0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] lg:shadow-[0_24px_54px_rgba(15,23,42,0.12),0_6px_14px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]
                      border border-transparent overflow-visible lg:overflow-hidden relative min-w-0"
        >
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTopic && (
            <TopicCard
              dimensionId={dimension.dimensionKey}
              topic={currentTopic}
            />
          )}
        </div>

        <div className="sticky bottom-0 z-20 px-4 sm:px-6 lg:px-10 py-3 lg:py-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.96)_38%)] backdrop-blur-md border-t border-gray-100/80 flex justify-between items-center shrink-0">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className={`px-8 sm:px-10 lg:px-12 py-2.5 rounded-full text-sm sm:text-base font-semibold text-center transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 ${
              hasPrevious
                ? 'bg-white text-[#1d6996] border border-[rgba(58,146,198,0.35)] hover:bg-[#f4f9fd] focus:ring-2 focus:ring-[#3a92c6] focus:ring-offset-2 focus:ring-offset-white'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-lg sm:text-xl"></span> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading || isSubmitting || pendingTopics.size > 0}
            className="px-8 sm:px-10 lg:px-12 py-2.5 bg-[#3a92c6] text-white rounded-full text-sm sm:text-base font-semibold text-center cursor-pointer transition-all duration-300 hover:bg-[#54a5d5] focus:ring-2 focus:ring-[#3a92c6] focus:ring-offset-2 focus:ring-offset-white shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : (isLastTopic ? 'Complete & View Results' : 'Next Step')} <span className="text-lg sm:text-xl"></span>
          </button>
        </div>
        </div>
      </div>

      <AssessmentGateDialog
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        missing={missingItems}
      />
    </div>
  );
}
