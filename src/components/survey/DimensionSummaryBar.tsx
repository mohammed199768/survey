'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface DimensionSummaryBarProps {
  dimensionTitle: string;
  answeredCount: number;
  totalCount: number;
}

export function DimensionSummaryBar({
  dimensionTitle,
  answeredCount,
  totalCount,
}: DimensionSummaryBarProps) {
  const percent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-horvath-50 rounded-xl flex items-center justify-center border border-horvath-100">
              <ShieldCheck className="w-5 h-5 text-horvath-700" />
           </div>
           <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Strategic Stream</span>
              <h2 className="text-lg font-black text-horvath-900 uppercase tracking-tight">{dimensionTitle}</h2>
           </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Progress Intensity</span>
              <div className="flex items-center gap-4">
                 <div className="w-48 h-1.5 bg-horvath-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-horvath-700 rounded-full"
                    />
                 </div>
                 <div className="text-sm font-black text-horvath-700 font-mono">
                   {Math.round(percent)}%
                 </div>
              </div>
           </div>

           <div className="h-8 w-px bg-slate-100" />

           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Integrity Check</span>
              <div className="text-sm font-black text-horvath-700 font-mono">
                {answeredCount} / {totalCount}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
