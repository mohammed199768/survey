'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface DualSliderProps {
  current: number;
  target: number;
  onCurrentChange: (val: number) => void;
  onTargetChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  topicId: string;
  labels?: Array<string | null>; // 5 level descriptions from API
}

const VALID_SCORES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

function snapToValidScore(value: number): number {
  return VALID_SCORES.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

const getAnchorForValue = (value: number, anchors: Array<string | null>): string | null => {
  if (anchors.length === 0) return null;
  const idx = Math.max(0, Math.min(anchors.length - 1, Math.round(value) - 1));
  return anchors[idx] ?? null;
};

export function DualSlider({
  current,
  target,
  onCurrentChange,
  onTargetChange,
  min = 1.0,
  max = 5.0,
  step = 0.5,
  topicId: _topicId,
  labels = [],
}: DualSliderProps) {
  const toSafeScore = React.useCallback((value: unknown, fallback: number) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(min, Math.min(max, value));
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }

    return fallback;
  }, [max, min]);

  const safeCurrent = toSafeScore(current, min);
  const safeTarget = toSafeScore(target, min);

  const getPercentage = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const snappedValue = snapToValidScore(rawValue);
    onCurrentChange(snappedValue);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const snappedValue = snapToValidScore(rawValue);
    onTargetChange(snappedValue);
  };

  const scaleMarkers = [1, 2, 3, 4, 5];
  const currentAnchor = React.useMemo(() => getAnchorForValue(safeCurrent, labels), [safeCurrent, labels]);
  const targetAnchor = React.useMemo(() => getAnchorForValue(safeTarget, labels), [safeTarget, labels]);

  const springTrack = { type: 'spring', stiffness: 220, damping: 28 } as const;
  const springBubble = { type: 'spring', stiffness: 300, damping: 30 } as const;

  const renderScaleRuler = () => (
    <div className="grid grid-cols-5 mt-6">
      {scaleMarkers.map((mark) => (
        <div key={mark} className="flex flex-col items-center">
          <div className="w-px h-3 bg-slate-300" />
          <span className="mt-2 text-[12px] font-bold text-slate-400 tabular-nums italic">
            {mark.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );

  const labelsForGrid = Array.from({ length: 5 }, (_, idx) => labels[idx] ?? '');

  return (
    <div className="w-full select-none py-4" style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}>
      <div className="max-w-[1200px] mx-auto flex flex-col px-4">
        {labels.length > 0 && (
          <>
            <div className="sm:hidden rounded-xl bg-white/65 border border-slate-200/70 p-3 space-y-2 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#b353a1]">Score Level</p>
                <p className="text-sm leading-[1.4] text-slate-800">{currentAnchor ?? 'No level description'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#3467d6]">Target Level</p>
                <p className="text-sm leading-[1.4] text-slate-800">{targetAnchor ?? 'No level description'}</p>
              </div>
            </div>

            <div className="hidden sm:grid grid-cols-5 mb-8">
              {labelsForGrid.map((label, idx) => (
                <div key={idx} className="px-2 flex flex-col items-center">
                  <p className="text-[13px] lg:text-[14px] leading-[1.4] text-slate-600 text-center min-h-[80px] flex items-end">
                    {label}
                  </p>
                  <div className="w-px h-4 bg-slate-200 mt-2" />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="space-y-10">
          <div className="relative flex items-center h-12">
            <div className="absolute -left-16 hidden lg:block text-[11px] font-black tracking-[0.2em] text-[#b353a1]/80 uppercase">
              Score
            </div>
            <div className="w-full relative h-[10px] bg-white/10 rounded-full border border-white/35 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_5px_rgba(15,23,42,0.18)]">
              <motion.div
                className="absolute left-0 h-full rounded-full bg-gradient-to-r from-[#ff88d5] via-[#d555b9] to-[#782fc7] shadow-[0_0_20px_rgba(213,85,185,0.38)]"
                animate={{ width: `${getPercentage(safeCurrent)}%` }}
                transition={springTrack}
                style={{ transformOrigin: 'left center' }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[64px] h-10 px-3.5 bg-gradient-to-br from-[#ff86d4] to-[#8a2cc6] rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.2),0_0_20px_rgba(212,74,178,0.36)] flex items-center justify-center border border-white/45 z-20"
                animate={{ left: `${getPercentage(safeCurrent)}%` }}
                transition={springBubble}
              >
                <span className="text-white font-bold text-base tabular-nums">{safeCurrent.toFixed(1)}</span>
              </motion.div>

              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={safeCurrent}
                onChange={handleCurrentChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              />
            </div>
          </div>

          <div className="relative flex items-center h-12">
            <div className="absolute -left-16 hidden lg:block text-[11px] font-black tracking-[0.2em] text-[#3467d6]/80 uppercase">
              Target
            </div>
            <div className="w-full relative h-[10px] bg-white/10 rounded-full border border-white/35 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_5px_rgba(15,23,42,0.18)]">
              <motion.div
                className="absolute left-0 h-full rounded-full bg-gradient-to-r from-[#75cbff] via-[#279af1] to-[#1e63d8] shadow-[0_0_20px_rgba(39,154,241,0.34)]"
                animate={{ width: `${getPercentage(safeTarget)}%` }}
                transition={springTrack}
                style={{ transformOrigin: 'left center' }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[64px] h-10 px-3.5 bg-gradient-to-br from-[#7cd3ff] to-[#1e63d8] rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.2),0_0_20px_rgba(39,154,241,0.33)] flex items-center justify-center border border-white/45 z-20"
                animate={{ left: `${getPercentage(safeTarget)}%` }}
                transition={springBubble}
              >
                <span className="text-white font-bold text-base tabular-nums">{safeTarget.toFixed(1)}</span>
              </motion.div>

              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={safeTarget}
                onChange={handleTargetChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              />
            </div>
          </div>
        </div>

        {renderScaleRuler()}
      </div>
    </div>
  );
}
