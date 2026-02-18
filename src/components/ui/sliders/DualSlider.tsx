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
  const labelColumnClass = 'w-24 sm:w-28 lg:w-32 shrink-0';
  const [isCurrentElastic, setIsCurrentElastic] = React.useState(false);
  const [isTargetElastic, setIsTargetElastic] = React.useState(false);
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
  const currentElasticTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const targetElasticTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const getPercentage = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const snappedValue = snapToValidScore(rawValue);
    setIsCurrentElastic(true);
    if (currentElasticTimeoutRef.current) {
      clearTimeout(currentElasticTimeoutRef.current);
    }
    currentElasticTimeoutRef.current = setTimeout(() => setIsCurrentElastic(false), 260);
    onCurrentChange(snappedValue);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const snappedValue = snapToValidScore(rawValue);
    setIsTargetElastic(true);
    if (targetElasticTimeoutRef.current) {
      clearTimeout(targetElasticTimeoutRef.current);
    }
    targetElasticTimeoutRef.current = setTimeout(() => setIsTargetElastic(false), 260);
    onTargetChange(snappedValue);
  };

  React.useEffect(() => {
    return () => {
      if (currentElasticTimeoutRef.current) clearTimeout(currentElasticTimeoutRef.current);
      if (targetElasticTimeoutRef.current) clearTimeout(targetElasticTimeoutRef.current);
    };
  }, []);

  const scaleMarkers = [1, 2, 3, 4, 5];
  const currentAnchor = React.useMemo(() => getAnchorForValue(safeCurrent, labels), [safeCurrent, labels]);
  const targetAnchor = React.useMemo(() => getAnchorForValue(safeTarget, labels), [safeTarget, labels]);

  const renderScaleRuler = () => (
    <div className="flex items-start gap-3 sm:gap-6 mt-2 sm:mt-3">
      <div className={`hidden sm:block ${labelColumnClass}`} />
      <div className="flex-1 relative h-12 border-t border-slate-200/80">
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {scaleMarkers.map((mark) => (
            <div key={mark} className="flex flex-col items-center -translate-x-1/2 first:translate-x-0 last:translate-x-0">
              <div className="w-px h-3 bg-slate-300" />
              <span className="mt-1.5 text-[0.68rem] sm:text-[0.72rem] font-semibold text-slate-400 tabular-nums">
                {mark.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full select-none pt-0 pb-1" style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}>
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

            <div className="hidden sm:flex items-start gap-8 -mb-1">
              <div className={labelColumnClass}></div>
              <div className="flex-1 grid grid-cols-5 gap-7">
                {labels.map((label, idx) => (
                  <div key={idx} className="text-center min-h-[108px] flex items-end justify-center">
                    <p className="text-[clamp(0.92rem,0.95vw,1.08rem)] font-normal text-slate-800/95 leading-[1.5] break-words">
                      {label ?? ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className={`w-full ${labelColumnClass} sm:pr-3 text-left sm:text-right`}>
            <span className="text-[0.78rem] sm:text-[0.86rem] font-medium text-[#b353a1] uppercase tracking-[0.24em]">
              SCORE
            </span>
          </div>

          <div className="flex-1 relative h-10 sm:h-11">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-white/10 border border-white/35 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_5px_rgba(15,23,42,0.18)]" />
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-gradient-to-b from-[#ff88d5] via-[#d555b9] to-[#782fc7] shadow-[0_0_22px_rgba(213,85,185,0.46)] transition-all duration-300 ${
                isCurrentElastic ? 'scale-x-[1.02]' : 'scale-x-100'
              }`}
              style={{ width: `${getPercentage(safeCurrent)}%`, transformOrigin: 'left center' }}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 sm:h-11 min-w-[64px] sm:min-w-[70px] px-3.5 sm:px-4 bg-gradient-to-b from-[#ff86d4] to-[#8a2cc6] rounded-full flex items-center justify-center border border-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_30px_rgba(0,0,0,0.2),0_0_24px_rgba(212,74,178,0.45)] transition-all duration-300 ease-out z-20 ${
                isCurrentElastic ? 'scale-[1.05]' : 'scale-100'
              }`}
              style={{ left: `${getPercentage(safeCurrent)}%` }}
            >
              <span className="text-[0.96rem] sm:text-[1.05rem] font-bold text-white tabular-nums">
                {safeCurrent.toFixed(1)}
              </span>
            </div>

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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className={`w-full ${labelColumnClass} sm:pr-3 text-left sm:text-right`}>
            <span className="text-[0.78rem] sm:text-[0.86rem] font-medium text-[#3467d6] uppercase tracking-[0.24em]">
              TARGET
            </span>
          </div>

          <div className="flex-1 relative h-10 sm:h-11">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-white/10 border border-white/35 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_5px_rgba(15,23,42,0.18)]" />
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-gradient-to-b from-[#75cbff] via-[#279af1] to-[#1e63d8] shadow-[0_0_22px_rgba(39,154,241,0.4)] transition-all duration-300 ${
                isTargetElastic ? 'scale-x-[1.02]' : 'scale-x-100'
              }`}
              style={{ width: `${getPercentage(safeTarget)}%`, transformOrigin: 'left center' }}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 sm:h-11 min-w-[64px] sm:min-w-[70px] px-3.5 sm:px-4 bg-gradient-to-b from-[#7cd3ff] to-[#1e63d8] rounded-full flex items-center justify-center border border-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_30px_rgba(0,0,0,0.2),0_0_24px_rgba(39,154,241,0.44)] transition-all duration-300 ease-out z-20 ${
                isTargetElastic ? 'scale-[1.05]' : 'scale-100'
              }`}
              style={{ left: `${getPercentage(safeTarget)}%` }}
            >
              <span className="text-[0.96rem] sm:text-[1.05rem] font-bold text-white tabular-nums">
                {safeTarget.toFixed(1)}
              </span>
            </div>

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

        {renderScaleRuler()}
      </div>
    </div>
  );
}
