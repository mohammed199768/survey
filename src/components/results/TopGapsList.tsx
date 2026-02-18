'use client';

import * as React from 'react';
import { TopGapModel } from '@/lib/scoring/compute';
import { formatGap } from '@/lib/scoring/number';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface TopGapsListProps {
  gaps: TopGapModel[];
}

export function TopGapsList({ gaps }: TopGapsListProps) {
  return (
    <div className="space-y-3">
      {gaps.map((gap) => (
        <div 
          key={gap.topicId}
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
             </div>
             <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                   {gap.dimensionTitle}
                </span>
                <h4 className="text-sm font-black text-horvath-dark uppercase tracking-tight">{gap.topicLabel}</h4>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Delta</span>
                <span className="text-lg font-black text-red-500 font-mono">-{formatGap(gap.gap)}</span>
             </div>
             <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
