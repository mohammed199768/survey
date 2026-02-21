'use client';

import * as React from 'react';
import { OverallScoreSummary } from '@/lib/scoring/compute';
import { formatScore, formatGap } from '@/lib/scoring/number';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function OverallSummaryCard({ summary }: { summary: OverallScoreSummary }) {
  const progressPercent = (summary.completedDimensions / summary.totalDimensions) * 100;

  const stats = [
    { label: 'Score Baseline', value: formatScore(summary.currentAvg), color: 'text-horvath-900' },
    { label: 'Strategic Target', value: formatScore(summary.targetAvg), color: 'text-horvath-700' },
    { label: 'Capability Gap', value: formatGap(summary.targetAvg - summary.currentAvg), color: 'text-slate-400' },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm font-sans h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-10 h-10 bg-horvath-50 rounded-xl flex items-center justify-center border border-slate-100">
            <Shield className="w-5 h-5 text-horvath-900" />
         </div>
         <div>
            <h3 className="text-sm font-black text-horvath-900 uppercase tracking-tight">Readiness Overview</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Intelligence Metrics</span>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-auto">
        {stats.map((stat) => (
          <div key={stat.label}>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{stat.label}</span>
             <span className={`text-xl sm:text-3xl font-black font-mono tracking-tighter ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-50">
         <div className="flex justify-between items-end mb-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Coverage</span>
            <span className="text-sm font-black text-horvath-900 font-mono">{Math.round(progressPercent)}%</span>
         </div>
         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-horvath-900 rounded-full"
            />
         </div>
      </div>
    </div>
  );
}
