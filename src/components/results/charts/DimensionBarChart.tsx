'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { DimensionResultModel } from '@/lib/scoring/compute';
import { formatScore } from '@/lib/scoring/number';

interface DimensionBarChartProps {
  dimensions: DimensionResultModel[];
}

const BRAND_COLORS = {
  primary: '#1d6996',
  secondary: '#3a92c6',
  tertiary: '#54a5d5',
  light: '#7fbadc',
  pale: '#b6d5eb',
} as const;

const SEMANTIC_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

export function DimensionBarChart({ dimensions }: DimensionBarChartProps) {
  const maxScore = 5;

  const overallCurrent =
    dimensions.length > 0
      ? dimensions.reduce((s, d) => s + d.currentAvg, 0) / dimensions.length
      : 0;
  const overallTarget =
    dimensions.length > 0
      ? dimensions.reduce((s, d) => s + d.targetAvg, 0) / dimensions.length
      : 0;
  const overallGap = overallTarget - overallCurrent;

  const dateNow = new Date().toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
  const dateTarget = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-US',
    { month: '2-digit', year: 'numeric' }
  );

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* ── Overall Row: circles only, no bars ── */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-20 sm:w-24 text-right text-xs font-bold text-green-600 uppercase">
            Overall
          </div>

          <div className="flex-1 relative h-10 bg-gray-200 rounded-lg flex items-center gap-6 px-4">
            {/* Current circle + score */}
            <div className="flex items-center gap-2">
                <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: BRAND_COLORS.light }}
              />
              <span className="text-sm font-semibold text-gray-900">
                {formatScore(overallCurrent)}
              </span>
            </div>
            {/* Target circle + score */}
            <div className="flex items-center gap-2">
                <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: BRAND_COLORS.secondary }}
              />
              <span className="text-sm font-semibold text-gray-900">
                {formatScore(overallTarget)}
              </span>
            </div>
          </div>

          <GapLabel gap={overallGap} />
        </div>
      </div>

      {/* ── Dimension Rows: two side-by-side bars ── */}
      <div className="flex-1 flex flex-col justify-around space-y-2">
        {dimensions.map((dim, idx) => (
          <DimensionRow
            key={dim.id}
            label={dim.title}
            current={dim.currentAvg}
            target={dim.targetAvg}
            maxScore={maxScore}
            index={idx}
          />
        ))}
      </div>

      {/* X-Axis Scale */}
      <div className="flex mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <div className="w-20 sm:w-24" /> {/* label spacer */}
        <div className="flex-1 flex justify-between px-1 ml-3">
          {[1.0, 2.0, 3.0, 4.0, 5.0].map(v => (
            <span key={v}>{v.toFixed(1)}</span>
          ))}
        </div>
        <div className="w-12" /> {/* gap spacer */}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: BRAND_COLORS.light }}
          />
          <span className="text-xs text-gray-500">Current - {dateNow}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: BRAND_COLORS.secondary }}
          />
          <span className="text-xs text-gray-500">Target - {dateTarget}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/* Dimension Row — TWO separate side-by-side bars      */
/* ─────────────────────────────────────────────────── */

interface DimensionRowProps {
  label: string;
  current: number;
  target: number;
  maxScore: number;
  index: number;
}

function DimensionRow({ label, current, target, maxScore, index }: DimensionRowProps) {
  const currentPct = (current / maxScore) * 100;
  const targetPct = (target / maxScore) * 100;
  const gap = target - current;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      {/* Label */}
      <div className="w-20 sm:w-24 text-right text-xs font-semibold text-gray-600 truncate">
        {label}
      </div>

      {/* Two bars side-by-side */}
      <div className="flex-1 flex items-center gap-1">
        {/* Current bar (pink) */}
        <div className="relative flex-1 h-8">
          <div className="absolute inset-0 bg-gray-100 rounded-lg" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: BRAND_COLORS.light }}
            initial={{ width: 0 }}
            animate={{ width: `${currentPct}%` }}
            transition={{ delay: index * 0.08 + 0.1, duration: 0.7, ease: 'easeOut' }}
          >
            <span className="text-xs font-bold text-white drop-shadow-sm whitespace-nowrap">
              {formatScore(current)}
            </span>
          </motion.div>
        </div>

        {/* Target bar (blue) */}
        <div className="relative flex-1 h-8">
          <div className="absolute inset-0 bg-gray-100 rounded-lg" />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: BRAND_COLORS.secondary }}
            initial={{ width: 0 }}
            animate={{ width: `${targetPct}%` }}
            transition={{ delay: index * 0.08 + 0.25, duration: 0.7, ease: 'easeOut' }}
          >
            <span className="text-xs font-bold text-white drop-shadow-sm whitespace-nowrap">
              {formatScore(target)}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Gap */}
      <GapLabel gap={gap} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────── */
/* Gap Label                                           */
/* ─────────────────────────────────────────────────── */

function GapLabel({ gap }: { gap: number }) {
  const absGap = Math.abs(gap);
  const display =
    gap > 0.05
      ? `−${absGap.toFixed(1)}`
      : gap < -0.05
        ? `+${absGap.toFixed(1)}`
        : '0.0';
  const color =
    gap > 0.05 ? 'text-gray-500' : gap < -0.05 ? 'text-emerald-600' : 'text-gray-400';

  return (
    <div className={`w-12 text-right text-xs font-semibold ${color}`}>
      {display}
    </div>
  );
}
