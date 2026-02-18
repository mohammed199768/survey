'use client';

import * as React from 'react';

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
  const currentAnchor = React.useMemo(() => getAnchorForValue(current, labels), [current, labels]);
  const targetAnchor = React.useMemo(() => getAnchorForValue(target, labels), [target, labels]);

  const renderTickRow = (heightClass = 'h-6', hideEdgeTicks = false) => (
    <div className="hidden sm:flex items-center gap-6">
      <div className="w-36 shrink-0" />
      <div className="flex-1 relative">
        {scaleMarkers
          .filter((score) => (hideEdgeTicks ? score !== min && score !== max : true))
          .map((score) => (
            <div
              key={score}
              className={`absolute rounded-full w-[2px] ${heightClass} bg-slate-400/80`}
              style={{
                left: `${((score - min) / (max - min)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
      </div>
    </div>
  );

  return (
    <div
      className="w-full select-none font-sans pt-0 pb-1"
      style={{ fontFamily: '"Segoe UI", Inter, Arial, sans-serif' }}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {labels.length > 0 && (
          <>
            <div className="sm:hidden rounded-xl bg-white/65 border border-slate-200/70 p-3 space-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#b353a1]">Score Level</p>
                <p className="text-sm leading-[1.4] text-slate-800">{currentAnchor ?? 'No level description'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#3467d6]">Target Level</p>
                <p className="text-sm leading-[1.4] text-slate-800">{targetAnchor ?? 'No level description'}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-start gap-6 -mb-1">
              <div className="w-36 shrink-0"></div>
              <div className="flex-1 grid grid-cols-5 gap-5">
                {labels.map((label, idx) => (
                  <div key={idx} className="text-center min-h-[104px] flex items-end justify-center">
                    <p className="text-[clamp(1rem,1vw,1.18rem)] font-medium text-slate-900 leading-[1.5] break-words">
                      {label ?? ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {renderTickRow('h-7', true)}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="w-full sm:w-36 sm:shrink-0 sm:pr-3 text-left sm:text-right">
            <span className="text-[clamp(1rem,4vw,1.35rem)] sm:text-[clamp(1.15rem,1.35vw,1.45rem)] font-bold text-[#b353a1] uppercase tracking-[0.02em]">
              SCORE
            </span>
          </div>

          <div className="flex-1 relative h-9 sm:h-10">
            <div className="absolute inset-0 bg-[#e7e8eb] rounded-full" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#c66ac0] to-[#8a63dc] transition-all duration-300 ease-out"
              style={{ width: `${getPercentage(current)}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 sm:h-10 min-w-[56px] sm:min-w-[62px] px-3 sm:px-4 bg-[#b353a1] rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(179,83,161,0.28)] border border-white transition-all duration-300 ease-out z-20"
              style={{ left: `${getPercentage(current)}%` }}
            >
              <span className="text-[0.92rem] sm:text-[1rem] font-bold text-white tabular-nums">
                {current.toFixed(1)}
              </span>
            </div>

            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={current}
              onChange={handleCurrentChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="w-full sm:w-36 sm:shrink-0 sm:pr-3 text-left sm:text-right">
            <span className="text-[clamp(1rem,4vw,1.35rem)] sm:text-[clamp(1.15rem,1.35vw,1.45rem)] font-bold text-[#3467d6] uppercase tracking-[0.02em]">
              TARGET
            </span>
          </div>

          <div className="flex-1 relative h-9 sm:h-10">
            <div className="absolute inset-0 bg-[#e7e8eb] rounded-full" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2990ea] to-[#1e6fd9] transition-all duration-300 ease-out"
              style={{ width: `${getPercentage(target)}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 sm:h-10 min-w-[56px] sm:min-w-[62px] px-3 sm:px-4 bg-[#3467d6] rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(52,103,214,0.28)] border border-white transition-all duration-300 ease-out z-20"
              style={{ left: `${getPercentage(target)}%` }}
            >
              <span className="text-[0.92rem] sm:text-[1rem] font-bold text-white tabular-nums">
                {target.toFixed(1)}
              </span>
            </div>

            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={target}
              onChange={handleTargetChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </div>
        </div>

        {renderTickRow('h-7', false)}

        <div className="flex items-center gap-3 sm:gap-6 mt-1.5">
          <div className="hidden sm:block w-36 shrink-0"></div>
          <div className="flex-1 grid grid-cols-5">
            {scaleMarkers.map((mark) => (
              <div key={mark} className="flex justify-center">
                <span className="text-[clamp(0.78rem,3.2vw,1.2rem)] sm:text-[clamp(1rem,1.05vw,1.2rem)] font-medium text-slate-500 tabular-nums">
                  {mark.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
