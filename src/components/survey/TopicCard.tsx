'use client';

import * as React from 'react';
import { TopicStructure } from '@/lib/api/types';
import { DualSlider } from '@/components/ui/sliders/DualSlider';
import { useReadinessStore } from '@/store/readiness/readiness.store';

export function TopicCard({ dimensionId: _dimensionId, topic }: { dimensionId: string; topic: TopicStructure }) {
  // Use flat responses structure from new store
  const response = useReadinessStore((state) => state.responses[topic.id]);
  const submitAnswer = useReadinessStore((state) => state.submitAnswer);
  const setResponse = useReadinessStore((state) => state.setResponse);
  const isSubmitting = useReadinessStore((state) => state.isSubmitting);
  
  const currentVal = response?.current ?? 1.0;
  const targetVal = response?.target ?? 1.0;

  const levelDescriptions = React.useMemo(() => {
    if (Array.isArray(topic.levelAnchors) && topic.levelAnchors.length === 5) {
      return topic.levelAnchors;
    }

    // Backward compatibility fallback for legacy prompt-encoded levels.
    if (!topic.prompt) return [];
    if (topic.prompt.includes('|')) {
      return topic.prompt
        .split('|')
        .map((s) => s.replace(/^Level\s+\d+:\s*/i, '').trim())
        .filter((s) => s.length > 0)
        .slice(0, 5);
    }
    if (topic.prompt.includes('\n')) {
      return topic.prompt
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^Level\s+\d+/i.test(line))
        .map((line) => line.replace(/^Level\s+\d+:\s*/i, '').trim())
        .slice(0, 5);
    }

    return [];
  }, [topic.levelAnchors, topic.prompt]);

  // Refs for debouncing - survives HMR
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = React.useCallback((tId: string, current: number, target: number) => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
          submitAnswer(tId, current, target);
      }, 1000); // 1 second debounce
  }, [submitAnswer]);

  const handleScoreChange = (field: 'current' | 'target', value: number) => {
    // Value is already snapped to valid level (1..5) by DualSlider.
    
    // Determine the new state
    const newCurrent = field === 'current' ? value : currentVal;
    const newTarget = field === 'target' ? value : targetVal;
    
    // 1. Immediate local update (optimistic)
    setResponse(topic.id, newCurrent, newTarget);
    
    // 2. Debounced API save
    debouncedSave(topic.id, newCurrent, newTarget);
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}
    >
       {/* Save indicator - subtle */}
       {isSubmitting && (
        <div className="absolute top-2 right-2 text-xs text-blue-500 font-medium animate-pulse">
            Saving...
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-5 lg:px-8 pt-5 lg:pt-6 pb-0 bg-white shrink-0">
        <div className="w-full max-w-[1240px] mx-auto">
          <h2 className="text-[clamp(1.12rem,4.3vw,1.72rem)] lg:text-[1.72rem] font-semibold text-slate-900 tracking-[-0.005em] leading-tight">
            {topic.label}
          </h2>
          <div className="h-px bg-[#eef0f5] mt-3.5" />
        </div>
      </div>

      {/* Prompt Strip */}
      <div className="px-4 sm:px-5 lg:px-8 pt-5 pb-2 lg:pb-3 bg-white shrink-0">
        <div className="w-full max-w-[1240px] mx-auto">
          <p className="text-[clamp(0.92rem,2.95vw,1.04rem)] lg:text-[1rem] font-medium text-slate-800 leading-[1.5] max-w-[1120px]">
            {topic.prompt}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 lg:px-8 pt-0 pb-6 lg:pb-8 bg-white flex-1 flex flex-col justify-start">
        <div className="w-full mx-auto max-w-[1240px]">
          <DualSlider
            current={currentVal}
            target={targetVal}
            onCurrentChange={(val) => handleScoreChange('current', val)}
            onTargetChange={(val) => handleScoreChange('target', val)}
            topicId={topic.id}
            min={1.0}
            max={5.0}
            step={0.5}
            labels={levelDescriptions}
          />
        </div>
      </div>
    </div>
  );
}
