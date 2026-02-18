'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { DimensionResultModel } from '@/lib/scoring/compute';
import { formatScore, calculateGap } from '@/lib/scoring/number';

interface RiskHeatmapProps {
  dimensions: DimensionResultModel[];
}

export function RiskHeatmap({ dimensions }: RiskHeatmapProps) {
  const getCellColor = (current: number, target: number) => {
    const gap = calculateGap(target, current);
    if (gap > 1.5) return { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444' };
    if (gap > 0.5) return { bg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B' };
    return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981' };
  };
  
  const getRiskLevel = (gap: number) => {
    if (gap > 1.5) return 'Critical';
    if (gap > 0.5) return 'Moderate';
    return 'Low';
  };
  
  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex-1 grid grid-cols-2 gap-3">
        {dimensions.map((dim, idx) => {
          const gap = calculateGap(dim.targetAvg, dim.currentAvg);
          const colors = getCellColor(dim.currentAvg, dim.targetAvg);
          
          return (
            <motion.div
              key={dim.id}
              className="relative rounded-xl p-4 flex flex-col justify-between overflow-hidden"
              style={{ 
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <div className="relative z-10">
                <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ fontFamily: 'Arial, sans-serif', color: '#1A4563' }}>
                  {dim.title.substring(0, 18)}
                </span>
                <span className="text-xs font-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif', color: '#1A4563' }}>
                  {formatScore(dim.currentAvg)}
                </span>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>
                  vs {formatScore(dim.targetAvg)}
                </span>
                <span 
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ 
                    fontFamily: 'Arial, sans-serif', 
                    backgroundColor: colors.border,
                    color: 'white'
                  }}
                >
                  {getRiskLevel(gap)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)', borderLeft: '2px solid #EF4444' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>Critical Gap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)', borderLeft: '2px solid #F59E0B' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.4)', borderLeft: '2px solid #10B981' }} />
          <span className="text-[10px] font-light uppercase tracking-wider" style={{ fontFamily: 'Arial, sans-serif', color: '#64748B' }}>On Track</span>
        </div>
      </div>
    </div>
  );
}
