// src/components/survey/DimensionContent.tsx

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopicCard } from '@/components/survey/TopicCard';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { AssessmentGateDialog } from '@/components/survey/AssessmentGateDialog';
import { AssessmentStructureResponse } from '@/lib/api/types';
import { BrandPreloader } from '@/components/common/BrandPreloader';

type MissingItem = {
  dimensionId: string;
  dimensionTitle: string;
  topicId: string;
  topicLabel: string;
};

type ResponseMap = Record<string, { current: number; target: number }>;

const getMissingItemsFromStore = (
  assessment: AssessmentStructureResponse | null,
  responses: ResponseMap
): MissingItem[] => {
  const missing: MissingItem[] = [];
  if (!assessment) return missing;

  assessment.dimensions.forEach((dim) => {
    dim.topics.forEach((topic) => {
      if (!responses[topic.id]) {
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

  const dimension = assessment?.dimensions.find((d) => d.dimensionKey === dimensionId);

  if (!assessment || !dimension) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <BrandPreloader size={120} label="Loading dimension..." />
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
      const missing = getMissingItemsFromStore(assessment, responses);

      if (missing.length > 0) {
        setMissingItems(missing);
        setShowCompletionDialog(true);
      } else {
        try {
          await completeAssessment();
          const target = responseId ? `/results?responseId=${encodeURIComponent(responseId)}` : '/results';
          router.push(target);
        } catch (e) {
          console.error('Completion failed', e);
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
    <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col px-4 sm:px-6 pt-4 pb-28 lg:ml-[344px] lg:mr-6 lg:mt-6 lg:h-[calc(100vh-7rem)] lg:min-h-0 lg:px-0 lg:pt-0 lg:pb-0">
      {isSubmitting && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg z-30 animate-pulse">
          Saving...
        </div>
      )}

      <div
        className="bg-white flex-1 min-h-[calc(100vh-8rem)] lg:min-h-0 flex flex-col rounded-2xl lg:rounded-[32px]
                    shadow-[0_10px_30px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.02)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.02)]
                    border border-gray-100/50 overflow-visible lg:overflow-hidden relative"
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTopic && (
            <TopicCard
              dimensionId={dimension.dimensionKey}
              topic={currentTopic}
            />
          )}
        </div>

        <div className="sticky bottom-0 z-20 px-4 sm:px-6 lg:px-12 py-3 lg:py-4 bg-white/95 lg:bg-white/85 backdrop-blur-md border-t border-gray-50 flex justify-between items-center shrink-0">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className={`px-4 sm:px-6 lg:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
              hasPrevious ? 'border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-lg sm:text-xl">&lt;-</span> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`px-5 sm:px-6 lg:px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 ${
              isLastTopic ? 'bg-green-600 hover:bg-green-700' : 'bg-[#00549F] hover:bg-[#004080]'
            }`}
          >
            {isLoading ? 'Processing...' : (isLastTopic ? 'Complete & View Results' : 'Next Step')} <span className="text-lg sm:text-xl">-&gt;</span>
          </button>
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
