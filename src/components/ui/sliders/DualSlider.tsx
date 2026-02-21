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

const LABEL_COL_W = 62; // px — width of SCORE/TARGET text column

// Label positions as percentages — same math as bubble: ((val-min)/(max-min))*100
// val=1 → 0%, val=2 → 25%, val=3 → 50%, val=4 → 75%, val=5 → 100%
const MARK_POSITIONS = [0, 25, 50, 75, 100]; // %

// Label width — fixed so text has room to wrap without being too wide
const LABEL_W = 120; // px

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
      if (Number.isFinite(parsed)) return Math.max(min, Math.min(max, parsed));
      return fallback;
    },
    [max, min]
  );

  const safeCurrent = toSafeScore(current, min);
  const safeTarget  = toSafeScore(target,  min);

  const getPercentage = (val: number) =>
    Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onCurrentChange(snapToValidScore(parseFloat(e.target.value)));

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onTargetChange(snapToValidScore(parseFloat(e.target.value)));

  const scaleMarkers  = [1, 2, 3, 4, 5];
  const currentAnchor = React.useMemo(() => getAnchorForValue(safeCurrent, labels), [safeCurrent, labels]);
  const targetAnchor  = React.useMemo(() => getAnchorForValue(safeTarget,  labels), [safeTarget,  labels]);
  const labelsForGrid = Array.from({ length: 5 }, (_, i) => labels[i] ?? '');

  const springTrack  = { type: 'spring', stiffness: 220, damping: 28 } as const;
  const springBubble = { type: 'spring', stiffness: 300, damping: 30 } as const;

  // Shared inline style for the SCORE/TARGET label column spacer
  const colStyle: React.CSSProperties = { width: LABEL_COL_W, minWidth: LABEL_COL_W, flexShrink: 0 };

  // ─── Absolute-position helper ─────────────────────────────────────────────
  // Every mark sits at left: MARK_POSITIONS[i]% inside a position:relative container.
  // translateX offset:
  //   - first mark (0%):   translateX(0)        — left edge of label = left edge of rail
  //   - last  mark (100%): translateX(-100%)    — right edge of label = right edge of rail
  //   - middle marks:      translateX(-50%)     — center of label = mark position
  const labelTranslate = (idx: number) =>
    idx === 0 ? '0%' : idx === 4 ? '-100%' : '-50%';

  // Text alignment follows the same logic
  const labelAlign = (idx: number): React.CSSProperties['textAlign'] =>
    idx === 0 ? 'left' : idx === 4 ? 'right' : 'center';

  return (
    <div
      className="w-full select-none py-[0.25rem]"
      style={{ fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' }}
    >
      <div className="w-[96%] max-w-[940px] mx-auto flex flex-col px-[2%]">

        {/* ── Mobile: anchor text boxes ──────────────────────────────── */}
        {labels.length > 0 && (
          <div className="sm:hidden rounded-xl bg-white/65 border border-slate-200/70 p-3 space-y-2 mb-5">
            <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#0F3F52]">Score Level</p>
              <p className="text-sm font-medium text-slate-800 leading-[1.5]">{currentAnchor ?? 'No level description'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#3a92c6]">Target Level</p>
              <p className="text-sm font-medium text-slate-800 leading-[1.5]">{targetAnchor ?? 'No level description'}</p>
            </div>
          </div>
        )}

        {/* ── Desktop: label grid ────────────────────────────────────── */}
        {labels.length > 0 && (
          <div className="hidden sm:flex items-stretch mt-2 lg:mt-3 mb-1 gap-3 sm:gap-5">
            {/* Spacer = same width as SCORE/TARGET col */}
            <div style={colStyle} />
            {/* Rail-width container with absolute-positioned labels */}
            <div className="flex-1 min-w-0 relative" style={{ minHeight: 80 }}>
              {labelsForGrid.map((label, idx) => (
                <div
                  key={idx}
                  className="absolute bottom-0 flex flex-col"
                  style={{
                    left: `${MARK_POSITIONS[idx]}%`,
                    transform: `translateX(${labelTranslate(idx)})`,
                    width: LABEL_W,
                  }}
                >
                  <p
                    className="text-[clamp(0.66rem,0.72vw+0.13rem,0.84rem)] font-semibold text-[#4B5563] leading-[1.36] break-words hyphens-auto"
                    style={{ textAlign: labelAlign(idx) }}
                  >
                    {label}
                  </p>
                  {/* Tick below label */}
                  <div
                    className="w-px h-[14px] bg-slate-300 mt-[5px] flex-shrink-0"
                    style={{ alignSelf: idx === 0 ? 'flex-start' : idx === 4 ? 'flex-end' : 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sliders ────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* SCORE */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="shrink-0 pr-2 text-left sm:text-right" style={colStyle}>
              <span className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: '#0F3F52' }}>SCORE</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-full relative h-[52px]">
                <div className="absolute inset-x-0 top-[5px] flex justify-between">
                  {scaleMarkers.map((m) => <div key={m} className="w-px h-[10px] bg-slate-300/80" />)}
                </div>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[10px] bg-[#f6f6f6] rounded-full border border-slate-200/60 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]" />
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-gradient-to-r from-[#0F3F52] to-[#0F3F52] shadow-[0_2px_14px_rgba(15,63,82,0.32)]"
                  animate={{ width: `${getPercentage(safeCurrent)}%` }}
                  transition={springTrack}
                  style={{ transformOrigin: 'left center' }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 min-w-[52px] h-[36px] px-[14px] bg-[linear-gradient(135deg,#0F3F52_0%,#0F3F52_100%)] rounded-full shadow-[0_4px_20px_rgba(15,63,82,0.4),0_1px_3px_rgba(0,0,0,0.1)] flex items-center justify-center border-[2.5px] border-white/90 z-20"
                  animate={{ left: `${getPercentage(safeCurrent)}%` }}
                  transition={springBubble}
                >
                  <span className="text-white font-bold text-[15px] tabular-nums">{safeCurrent.toFixed(1)}</span>
                </motion.div>
                <input type="range" min={min} max={max} step={step} value={safeCurrent} onChange={handleCurrentChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
              </div>
            </div>
          </div>

          {/* TARGET */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="shrink-0 pr-2 text-left sm:text-right" style={colStyle}>
              <span className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: '#3a92c6' }}>TARGET</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="w-full relative h-[52px]">
                <div className="absolute inset-x-0 top-[5px] flex justify-between">
                  {scaleMarkers.map((m) => <div key={m} className="w-px h-[10px] bg-slate-300/80" />)}
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
                  style={safeTarget <= min
                    ? { background: '#f6f6f6', color: '#54a5d5', borderColor: '#54a5d5' }
                    : { background: 'linear-gradient(135deg,#54a5d5 0%,#3a92c6 100%)', borderColor: 'rgba(255,255,255,0.9)' }}
                  animate={{ left: `${getPercentage(safeTarget)}%` }}
                  transition={springBubble}
                >
                  <span className={`font-bold text-[15px] tabular-nums ${safeTarget <= min ? 'text-[#54a5d5]' : 'text-white'}`}>
                    {safeTarget.toFixed(1)}
                  </span>
                </motion.div>
                <input type="range" min={min} max={max} step={step} value={safeTarget} onChange={handleTargetChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Ruler ──────────────────────────────────────────────────── */}

        {/* Mobile */}
        <div className="sm:hidden mt-5 px-3 grid grid-cols-5">
          {scaleMarkers.map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-3 bg-slate-300" />
              <span className="mt-2 text-[11px] font-bold text-slate-400 tabular-nums italic">{mark.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* Desktop — same structure as label grid */}
        <div className="hidden sm:flex items-start mt-3 gap-3 sm:gap-5">
          <div style={colStyle} />
          <div className="flex-1 min-w-0 relative h-8">
            {scaleMarkers.map((mark, idx) => (
              <div
                key={mark}
                className="absolute top-0 flex flex-col"
                style={{
                  left: `${MARK_POSITIONS[idx]}%`,
                  transform: `translateX(${labelTranslate(idx)})`,
                  alignItems: idx === 0 ? 'flex-start' : idx === 4 ? 'flex-end' : 'center',
                }}
              >
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
