// src/components/survey/DimensionContent.tsx

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopicCard } from '@/components/survey/TopicCard';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { AssessmentGateDialog } from '@/components/survey/AssessmentGateDialog';
import { AssessmentStructureResponse } from '@/lib/api/types';
import { BrandPreloader } from '@/components/common/BrandPreloader';
// Removed static definition imports

// Helper to find missing items from store
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
                    topicLabel: topic.label
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

  // Find current dimension and topic from store data
  const dimension = assessment?.dimensions.find(d => d.dimensionKey === dimensionId);
  
  // If data not loaded yet or invalid dimension, might want to show loading or redirect
  // But parent page fallback should handle major loading.
  
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
  
  // Navigation Logic
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
          // Complete assessment
          try {
             await completeAssessment();
             const target = responseId ? `/results?responseId=${encodeURIComponent(responseId)}` : '/results';
             router.push(target);
          } catch (e) {
             console.error('Completion failed', e);
             // Show error toast/alert
          }
      }
      return;
    }

    if (topicIndex < dimension.topics.length - 1) {
      // Next topic in same dimension
      const targetTopic = dimension.topics[topicIndex + 1];
      router.push(`/survey/${dimension.dimensionKey}?topic=${targetTopic.topicKey}`);
    } else if (currentDimIndex < allDimensions.length - 1) {
      // Next dimension
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
    <div className="fixed top-[6rem] left-[344px] right-[24px] bottom-[24px] flex flex-col z-10">
      
           {/* Saving Indicator */}
           {isSubmitting && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg z-20 animate-pulse">
              Saving...
            </div>
          )}

      {/* Main Card */}
      <div className="bg-white flex-1 flex flex-col rounded-[32px] 
                    shadow-[0_20px_50px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.02)] 
                    border border-gray-100/50 overflow-hidden relative">
        
        {/* Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTopic && (
            <TopicCard
              dimensionId={dimension.dimensionKey}
              topic={currentTopic}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-12 py-4 bg-white/85 backdrop-blur-md border-t border-gray-50 flex justify-between items-center shrink-0">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2.5 border ${
              hasPrevious ? 'border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="text-xl">←</span> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`px-10 py-2.5 rounded-full text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2.5 disabled:opacity-70 ${
                isLastTopic ? 'bg-green-600 hover:bg-green-700' : 'bg-[#00549F] hover:bg-[#004080]'
            }`}
          >
            {isLoading ? 'Processing...' : (isLastTopic ? 'Complete & View Results' : 'Next Step')} <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {/* Completion Dialog */}
      <AssessmentGateDialog 
        open={showCompletionDialog} 
        onClose={() => setShowCompletionDialog(false)} 
        missing={missingItems} 
      />
    </div>
  );
}
