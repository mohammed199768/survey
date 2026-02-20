'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TopGapModel } from '@/lib/scoring/compute';
import { formatGap } from '@/lib/scoring/number';

interface GapVarianceChartProps {
  gaps: TopGapModel[];
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

export function GapVarianceChart({ gaps }: GapVarianceChartProps) {
  const maxGap = Math.max(...gaps.map(g => Math.abs(g.gap)), 1);
  
  return (
    <div className="w-full h-full flex flex-col justify-center p-4">
      <div className="flex-1 flex flex-col justify-around space-y-2">
        {gaps.slice(0, 6).map((gap, idx) => {
          const gapValue = Math.abs(gap.gap);
          const barWidth = (gapValue / maxGap) * 100;
          
          return (
            <motion.div
              key={gap.topicId}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <div className="w-24 text-right truncate">
                <span className="text-xs font-bold uppercase tracking-wider truncate block" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.primary }}>
                  {gap.dimensionTitle.split(' ')[0]}
                </span>
              </div>
              <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.5, ease: 'easeOut' }}
                  style={{ backgroundColor: gap.gap > 1.5 ? SEMANTIC_COLORS.error : gap.gap > 0.5 ? SEMANTIC_COLORS.warning : SEMANTIC_COLORS.success }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'Arial Black, Arial, sans-serif', color: BRAND_COLORS.primary }}>
                    -{formatGap(gap.gap)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SEMANTIC_COLORS.error }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.light }}>Critical {'>'}1.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SEMANTIC_COLORS.warning }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.light }}>Moderate {'>'}0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: SEMANTIC_COLORS.success }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.light }}>Minor</span>
        </div>
      </div>
    </div>
  );
}
