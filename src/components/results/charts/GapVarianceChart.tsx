'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TopGapModel } from '@/lib/scoring/compute';
import { formatGap } from '@/lib/scoring/number';

interface GapVarianceChartProps {
  gaps: TopGapModel[];
}

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
                <span className="text-xs font-bold uppercase tracking-wider truncate block" style={{ fontFamily: 'Arial, sans-serif', color: '#1A4563' }}>
                  {gap.dimensionTitle.split(' ')[0]}
                </span>
              </div>
              <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.5, ease: 'easeOut' }}
                  style={{ backgroundColor: gap.gap > 1.5 ? '#EF4444' : gap.gap > 0.5 ? '#F59E0B' : '#10B981' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'Arial Black, Arial, sans-serif', color: '#1A4563' }}>
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
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>Critical {'>'}1.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>Moderate {'>'}0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>Minor</span>
        </div>
      </div>
    </div>
  );
}
