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
  labels?: Array<string | null>;
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

// LABEL_COL_W: fixed width for SCORE/TARGET text column
// Must be identical across labels row, slider rows, and ruler row
// so that all three share the same left edge → perfect alignment.
const LABEL_COL_W = 62; // px

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
  const toSafeScore = React.useCallback(
    (value: unknown, fallback: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(min, Math.min(max, value));
      }
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.max(min, Math.min(max, parsed));
      }
      return fallback;
    },
    [max, min]
  );

  const safeCurrent = toSafeScore(current, min);
  const safeTarget = toSafeScore(target, min);

  const getPercentage = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCurrentChange(snapToValidScore(parseFloat(e.target.value)));
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTargetChange(snapToValidScore(parseFloat(e.target.value)));
  };

  const scaleMarkers = [1, 2, 3, 4, 5];
  const currentAnchor = React.useMemo(() => getAnchorForValue(safeCurrent, labels), [safeCurrent, labels]);
  const targetAnchor = React.useMemo(() => getAnchorForValue(safeTarget, labels), [safeTarget, labels]);

  const springTrack  = { type: 'spring', stiffness: 220, damping: 28 } as const;
  const springBubble = { type: 'spring', stiffness: 300, damping: 30 } as const;

  const labelsForGrid = Array.from({ length: 5 }, (_, idx) => labels[idx] ?? '');

  // ─── Shared layout helpers ──────────────────────────────────────────────────
  //
  // Every row (labels, SCORE rail, TARGET rail, ruler) is built from:
  //   [fixed spacer: LABEL_COL_W px] + [flex-1 rail/grid]
  //
  // The spacer width is identical in all rows → left edges align perfectly.
  // NO negative margins anywhere — they were the root cause of misalignment.
  //
  // Inside the labels/ruler grid we use grid-cols-5 with alignment per cell:
  //   col 0 → items-start / text-left   (tick at far left  = slider 0%)
  //   col 4 → items-end   / text-right  (tick at far right = slider 100%)
  //   cols 1-3 → items-center / text-center
  //
  // This matches the slider bubble math: left = ((val-min)/(max-min)) * 100%

  const labelColStyle: React.CSSProperties = {
    width: LABEL_COL_W,
    minWidth: LABEL_COL_W,
    flexShrink: 0,
  };

  // ─── KEY INSIGHT ────────────────────────────────────────────────────────────
  //
  // The slider rail uses `justify-between` with 5 tick marks.
  // In a flex justify-between with N items, the items sit at positions:
  //   0%, 25%, 50%, 75%, 100%  of the rail width
  // which matches the scale marks 1, 2, 3, 4, 5.
  //
  // The bubble/fill use left% calculated from (val-min)/(max-min)*100
  // which also gives 0%, 25%, 50%, 75%, 100% for values 1,2,3,4,5.
  //
  // THEREFORE: the labels grid and ruler grid just need to be the same
  // width as the rail, starting at the same x-position.
  //
  // We achieve this with a single shared row structure:
  //   [fixed spacer = LABEL_COL_W px] [flex-1 = rail area]
  //
  // The gap between label-col and rail (gap-3 sm:gap-5) adds extra space.
  // We must account for this gap in the labels/ruler rows too.
  // Solution: use the SAME gap on labels/ruler rows as on slider rows.
  //
  // The outer container padding (px-[2%]) applies equally to ALL rows,
  // so it doesn't affect relative alignment — no need to compensate for it.
  // ────────────────────────────────────────────────────────────────────────────

  // Shared row: used for labels, score, target, ruler
  // Classes must be identical so all rows share the same column geometry
  const ROW_CLASS = 'flex items-center gap-3 sm:gap-5';

  return (
    <div
      className="w-full select-none py-[0.25rem]"
      style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}
    >
      {/* Same outer container as original — px-[2%] applies to ALL rows equally */}
      <div className="w-[96%] max-w-[940px] mx-auto flex flex-col px-[2%]">

        {/* ── Mobile: anchor text boxes ──────────────────────────────────────── */}
        {labels.length > 0 && (
          <div className="sm:hidden rounded-xl bg-white/65 border border-slate-200/70 p-3 space-y-2 mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#7fbadc]">Score Level</p>
              <p className="text-sm font-medium text-slate-800 leading-[1.5]">
                {currentAnchor ?? 'No level description'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#3a92c6]">Target Level</p>
              <p className="text-sm font-medium text-slate-800 leading-[1.5]">
                {targetAnchor ?? 'No level description'}
              </p>
            </div>
          </div>
        )}

        {/* ── Desktop: label grid ────────────────────────────────────────────── */}
        {/* Uses SAME ROW_CLASS as slider rows → identical column widths → perfect alignment */}
        {labels.length > 0 && (
          <div className={`hidden sm:flex items-end mb-2 gap-3 sm:gap-5`}>
            {/* Spacer: exact same width as SCORE/TARGET label col */}
            <div style={labelColStyle} className="shrink-0" />
            {/* Label cells: grid-cols-5 — all centered uniformly */}
            <div className="flex-1 min-w-0 grid grid-cols-5">
              {labelsForGrid.map((label, idx) => (
                <div key={idx} className="flex flex-col items-center px-1">
                  <p className="text-[clamp(0.62rem,0.7vw+0.1rem,0.78rem)] font-medium text-slate-700 leading-[1.38] min-h-[4rem] w-full flex items-end justify-center text-center break-words hyphens-auto">
                    {label}
                  </p>
                  <div className="w-px h-[14px] bg-slate-300 mt-[5px] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCORE + TARGET slider rows ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* SCORE */}
          <div className={ROW_CLASS}>
            <div className="shrink-0 pr-2 text-left sm:text-right" style={labelColStyle}>
              <span className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: '#7fbadc' }}>
                SCORE
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-full relative h-[52px]">
                <div className="absolute inset-x-0 top-[5px] flex justify-between px-[1px]">
                  {scaleMarkers.map((mark) => (
                    <div key={`score-top-${mark}`} className="w-px h-[10px] bg-slate-300/80" />
                  ))}
                </div>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[10px] bg-[#f6f6f6] rounded-full border border-slate-200/60 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]" />
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-gradient-to-r from-[#b6d5eb] to-[#7fbadc] shadow-[0_2px_14px_rgba(127,186,220,0.32)]"
                  animate={{ width: `${getPercentage(safeCurrent)}%` }}
                  transition={springTrack}
                  style={{ transformOrigin: 'left center' }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[52px] h-[36px] px-[14px] bg-[linear-gradient(135deg,#b6d5eb_0%,#7fbadc_100%)] rounded-full shadow-[0_4px_20px_rgba(127,186,220,0.4),0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-center border-[2.5px] border-white/90 z-20"
                  animate={{ left: `${getPercentage(safeCurrent)}%` }}
                  transition={springBubble}
                >
                  <span className="text-white font-bold text-[15px] tabular-nums">{safeCurrent.toFixed(1)}</span>
                </motion.div>
                <input
                  type="range" min={min} max={max} step={step} value={safeCurrent}
                  onChange={handleCurrentChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
              </div>
            </div>
          </div>

          {/* TARGET */}
          <div className={ROW_CLASS}>
            <div className="shrink-0 pr-2 text-left sm:text-right" style={labelColStyle}>
              <span className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: '#3a92c6' }}>
                TARGET
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-full relative h-[52px]">
                <div className="absolute inset-x-0 top-[5px] flex justify-between px-[1px]">
                  {scaleMarkers.map((mark) => (
                    <div key={`target-top-${mark}`} className="w-px h-[10px] bg-slate-300/80" />
                  ))}
                </div>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[10px] bg-[#f6f6f6] rounded-full border border-slate-200/60 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]" />
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-gradient-to-r from-[#54a5d5] to-[#3a92c6] shadow-[0_2px_14px_rgba(58,146,198,0.28)]"
                  animate={{ width: `${getPercentage(safeTarget)}%` }}
                  transition={springTrack}
                  style={{ transformOrigin: 'left center' }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[52px] h-[36px] px-[14px] rounded-full shadow-[0_4px_20px_rgba(58,146,198,0.34),0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-center border-[2.5px] z-20"
                  style={
                    safeTarget <= min
                      ? { background: '#f6f6f6', color: '#54a5d5', borderColor: '#54a5d5' }
                      : { background: 'linear-gradient(135deg,#54a5d5 0%,#3a92c6 100%)', borderColor: 'rgba(255,255,255,0.9)' }
                  }
                  animate={{ left: `${getPercentage(safeTarget)}%` }}
                  transition={springBubble}
                >
                  <span className={`font-bold text-[15px] tabular-nums ${safeTarget <= min ? 'text-[#54a5d5]' : 'text-white'}`}>
                    {safeTarget.toFixed(1)}
                  </span>
                </motion.div>
                <input
                  type="range" min={min} max={max} step={step} value={safeTarget}
                  onChange={handleTargetChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Scale ruler ───────────────────────────────────────────────────── */}

        {/* Mobile: simple centered grid */}
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

        {/* Desktop ruler: same ROW_CLASS + grid-cols-5 → guaranteed alignment with slider marks */}
        <div className={`hidden sm:flex items-start mt-3 gap-3 sm:gap-5`}>
          <div style={labelColStyle} className="shrink-0" />
          <div className="flex-1 min-w-0 grid grid-cols-5">
            {scaleMarkers.map((mark) => (
              <div key={mark} className="flex flex-col items-center">
                <div className="w-px h-3 bg-slate-300" />
                <span className="mt-1.5 text-[11px] font-bold text-slate-400 tabular-nums italic">
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