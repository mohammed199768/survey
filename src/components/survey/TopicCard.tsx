'use client';

import * as React from 'react';
import { TopicStructure } from '@/lib/api/types';
import { DualSlider } from '@/components/ui/sliders/DualSlider';
import { useReadinessStore } from '@/store/readiness/readiness.store';

export function TopicCard({ dimensionId: _dimensionId, topic }: { dimensionId: string; topic: TopicStructure }) {
  // Use flat responses structure from new store
  const response = useReadinessStore((state) => state.responses[topic.id]);
  const submitAnswer = useReadinessStore((state) => state.submitAnswer);
  const [localError, setLocalError] = React.useState(false);
  
  const confirmedCurrent = response?.current ?? 1.0;
  const confirmedTarget = response?.target ?? 1.0;
  const [localCurrent, setLocalCurrent] = React.useState(confirmedCurrent);
  const [localTarget, setLocalTarget] = React.useState(confirmedTarget);

  const levelDescriptions = React.useMemo(() => {
    // Priority 1: individual level label fields from API
    const fromFields = [
      topic.level_1_label,
      topic.level_2_label,
      topic.level_3_label,
      topic.level_4_label,
      topic.level_5_label,
    ].filter((label): label is string => typeof label === 'string' && label.trim().length > 0);

    if (fromFields.length === 5) {
      return fromFields;
    }

    // Priority 2: levelAnchors array
    if (Array.isArray(topic.levelAnchors) && topic.levelAnchors.length === 5) {
      return topic.levelAnchors;
    }

    // Priority 3: backward compatibility fallback for legacy prompt-encoded levels.
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
  }, [
    topic.level_1_label,
    topic.level_2_label,
    topic.level_3_label,
    topic.level_4_label,
    topic.level_5_label,
    topic.levelAnchors,
    topic.prompt,
  ]);

  React.useEffect(() => {
    setLocalCurrent(confirmedCurrent);
  }, [confirmedCurrent]);

  React.useEffect(() => {
    setLocalTarget(confirmedTarget);
  }, [confirmedTarget]);

  // Refs for debouncing - survives HMR
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = React.useCallback((tId: string, current: number, target: number, rollbackCurrent: number, rollbackTarget: number) => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
          void (async () => {
            try {
              await submitAnswer(tId, current, target);
            } catch {
              setLocalCurrent(rollbackCurrent);
              setLocalTarget(rollbackTarget);
              setLocalError(true);
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => setLocalError(false), 3000);
            }
          })();
      }, 1000); // 1 second debounce
  }, [submitAnswer]);

  const handleScoreChange = (field: 'current' | 'target', value: number) => {
    // Value is already snapped to valid level (1..5) by DualSlider.
    
    // Determine the new state
    const newCurrent = field === 'current' ? value : localCurrent;
    const newTarget = field === 'target' ? value : localTarget;
    const rollbackCurrent = confirmedCurrent;
    const rollbackTarget = confirmedTarget;

    setLocalCurrent(newCurrent);
    setLocalTarget(newTarget);
    
    // Debounced API save
    debouncedSave(topic.id, newCurrent, newTarget, rollbackCurrent, rollbackTarget);
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative bg-white border border-horvath-100 rounded-2xl"
      style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 lg:px-8 pt-5 lg:pt-6 pb-0 bg-white shrink-0">
        <div className="w-full max-w-[1240px] mx-auto">
          <h2 className="text-[clamp(1.05rem,2.2vw+0.3rem,1.65rem)] font-semibold text-slate-900 tracking-[-0.005em] leading-tight break-words">
            {topic.label}
          </h2>
          <div className="h-px bg-[#d8e9f5] mt-3.5" />
        </div>
      </div>

      {/* Prompt Strip */}
      <div className="px-4 sm:px-5 lg:px-8 pt-5 pb-2 lg:pb-3 bg-white shrink-0">
        <div className="w-full max-w-[1240px] mx-auto">
          <p className="text-[clamp(0.88rem,1vw+0.5rem,1rem)] font-medium text-slate-800 leading-[1.55] max-w-[1120px]">
            {topic.prompt}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 lg:px-8 pt-1 pb-6 lg:pb-8 bg-white flex-1 flex flex-col justify-start">
        <div className="w-full mx-auto max-w-[1240px]">
          <DualSlider
            current={localCurrent}
            target={localTarget}
            onCurrentChange={(val) => handleScoreChange('current', val)}
            onTargetChange={(val) => handleScoreChange('target', val)}
            topicId={topic.id}
            min={1.0}
            max={5.0}
            step={0.5}
            labels={levelDescriptions}
          />
          {localError && (
            <p className="text-xs text-red-500 mt-1">Failed to save. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
