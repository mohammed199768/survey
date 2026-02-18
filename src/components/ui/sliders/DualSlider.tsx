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
  const railRef = React.useRef<HTMLDivElement>(null);
  const [railWidth, setRailWidth] = React.useState<number>(0);

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
  const labelColumnClass = 'shrink-0';
  const labelColumnWidth = 'clamp(56px, 7.5vw, 72px)';
  const railPaddingClass = 'px-0';

  React.useEffect(() => {
    const element = railRef.current;
    if (!element) return;

    const updateWidth = () => {
      setRailWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const renderScaleRuler = () => (
    <>
      <div className="sm:hidden mt-5">
        <div className="px-3 grid grid-cols-5">
          {scaleMarkers.map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-3 bg-slate-300" />
              <span className="mt-2 text-[11px] font-bold text-slate-400 tabular-nums italic">
                {mark.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden sm:block mt-6" style={{ marginLeft: labelColumnWidth }}>
        <div className="relative h-9">
          {railWidth > 0 &&
            scaleMarkers.map((mark) => (
              <div
                key={mark}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${((mark - 1) / 4) * railWidth}px` }}
              >
                <div className="w-px h-3 bg-slate-300" />
                <span className="mt-2 text-[12px] font-bold text-slate-400 tabular-nums italic">
                  {mark.toFixed(1)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </>
  );

  const labelsForGrid = Array.from({ length: 5 }, (_, idx) => labels[idx] ?? '');

  return (
    <div className="w-full select-none py-1" style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}>
      <div className="w-[96%] max-w-[940px] mx-auto flex flex-col px-[1%]">
        {labels.length > 0 && (
          <>
            <div className="sm:hidden rounded-xl bg-white/65 border border-slate-200/70 p-3 space-y-2 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#b353a1]">Score Level</p>
                <p className="text-[clamp(0.92rem,2.95vw,1.04rem)] lg:text-[1rem] font-medium text-slate-800 leading-[1.5]">
                  {currentAnchor ?? 'No level description'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#3467d6]">Target Level</p>
                <p className="text-[clamp(0.92rem,2.95vw,1.04rem)] lg:text-[1rem] font-medium text-slate-800 leading-[1.5]">
                  {targetAnchor ?? 'No level description'}
                </p>
              </div>
            </div>

            <div className="hidden sm:block mb-5" style={{ marginLeft: labelColumnWidth }}>
              <div className="relative h-[108px]">
                {railWidth > 0 &&
                  labelsForGrid.map((label, idx) => {
                    const mark = idx + 1;
                    return (
                      <div
                        key={idx}
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                        style={{
                          left: `${((mark - 1) / 4) * railWidth}px`,
                          width: `${railWidth / 4}px`,
                        }}
                      >
                        <p className="text-[clamp(0.92rem,2.95vw,1.04rem)] lg:text-[1rem] font-medium text-slate-800 leading-[1.5] text-center h-[80px] w-full flex items-end justify-center">
                          {label}
                        </p>
                        <div className="w-px h-[18px] bg-slate-300 mt-[10px]" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        <div className="space-y-7">
          <div className="relative flex items-center gap-3 sm:gap-5">
            <div className={`${labelColumnClass} pr-2 text-left sm:text-right`} style={{ width: labelColumnWidth }}>
              <span className="text-[11px] font-black tracking-[0.18em] text-[#a855f7] uppercase">
                SCORE
              </span>
            </div>
            <div ref={railRef} className={`flex-1 ${railPaddingClass}`}>
              <div className="w-full relative h-[52px]">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[10px] bg-[#eef0f5] rounded-full border border-slate-200/60 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]" />
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-gradient-to-r from-[#e090ff] via-[#a020d8] to-[#7c3aed] shadow-[0_2px_14px_rgba(168,85,247,0.32)]"
                  animate={{ width: `${getPercentage(safeCurrent)}%` }}
                  transition={springTrack}
                  style={{ transformOrigin: 'left center' }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[52px] h-[36px] px-[14px] bg-gradient-to-br from-[#d580f7] to-[#9333ea] rounded-full shadow-[0_4px_20px_rgba(168,85,247,0.4),0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-center border-[2.5px] border-white/90 z-20"
                  animate={{ left: `${getPercentage(safeCurrent)}%` }}
                  transition={springBubble}
                >
                  <span className="text-white font-bold text-[15px] tabular-nums">{safeCurrent.toFixed(1)}</span>
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
          </div>

          <div className="relative flex items-center gap-3 sm:gap-5">
            <div className={`${labelColumnClass} pr-2 text-left sm:text-right`} style={{ width: labelColumnWidth }}>
              <span className="text-[11px] font-black tracking-[0.18em] text-[#2563eb] uppercase">
                TARGET
              </span>
            </div>
            <div className={`flex-1 ${railPaddingClass}`}>
              <div className="w-full relative h-[52px]">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[10px] bg-[#eef0f5] rounded-full border border-slate-200/60 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]" />
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-gradient-to-r from-[#60a5fa] via-[#2563eb] to-[#1d4ed8] shadow-[0_2px_14px_rgba(37,99,235,0.28)]"
                  animate={{ width: `${getPercentage(safeTarget)}%` }}
                  transition={springTrack}
                  style={{ transformOrigin: 'left center' }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[52px] h-[36px] px-[14px] bg-gradient-to-br from-[#60a5fa] to-[#2563eb] rounded-full shadow-[0_4px_20px_rgba(37,99,235,0.34),0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-center border-[2.5px] border-white/90 z-20"
                  animate={{ left: `${getPercentage(safeTarget)}%` }}
                  transition={springBubble}
                >
                  <span className="text-white font-bold text-[15px] tabular-nums">{safeTarget.toFixed(1)}</span>
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
        </div>

        {renderScaleRuler()}
      </div>
    </div>
  );
}
