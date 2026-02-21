'use client';

import * as React from 'react';
import Link from 'next/link';
import { DimensionResultModel } from '@/lib/scoring/compute';
import { formatScore, formatGap } from '@/lib/scoring/number';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { DimensionMaturity } from '@/lib/maturity/model';
import { twMerge } from 'tailwind-merge';

export function DimensionResultCard({ 
  dimension, 
  maturity 
}: { 
  dimension: DimensionResultModel;
  maturity?: DimensionMaturity; 
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 flex flex-col h-full relative group transition-all duration-300 shadow-sm hover:shadow-md font-sans">
      <div className="flex justify-between items-start mb-8">
         <div className="flex-1 pr-6">
            {maturity && (
               <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-4 bg-slate-50 border border-slate-100 text-slate-400">
                  {maturity.stage.label}
               </div>
            )}
            <h3 className="text-xl font-black text-horvath-900 group-hover:text-horvath-700 transition-colors leading-tight uppercase tracking-tight">
                {dimension.title}
            </h3>
         </div>
         
         <div className={twMerge(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
            dimension.isComplete 
               ? "bg-horvath-700/5 text-horvath-700 border-horvath-700/20" 
               : "bg-slate-50 text-slate-200 border-slate-100"
         )}>
            {dimension.isComplete ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 py-4 border-y border-slate-50 font-mono">
         <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 block uppercase font-black tracking-widest mb-1">Score</span>
            <span className="text-xl font-black text-horvath-900 tracking-tighter leading-none">{formatScore(dimension.currentAvg)}</span>
         </div>
         <div className="flex flex-col sm:border-x border-slate-100 px-0 sm:px-4">
            <span className="text-[8px] text-horvath-700 block uppercase font-black tracking-widest mb-1">Target</span>
            <span className="text-xl font-black text-horvath-700 tracking-tighter leading-none">{formatScore(dimension.targetAvg)}</span>
         </div>
         <div className="flex flex-col sm:text-right">
            <span className="text-[8px] text-slate-400 block uppercase font-black tracking-widest mb-1">Gap</span>
            <span className={twMerge(
               "text-xl font-black tracking-tighter leading-none transition-colors",
               dimension.gapAvg > 1.0 ? 'text-red-500' : 'text-slate-300'
            )}>
               {dimension.gapAvg > 0 ? '+' : ''}{formatGap(dimension.gapAvg)}
            </span>
         </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
         <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coverage</span>
            <span className="text-xs font-black text-horvath-900">
               {dimension.answeredCount} / {dimension.totalCount}
            </span>
         </div>
         
         <Link 
           href={`/survey/${dimension.id}`}
           className="px-6 py-2 bg-horvath-50 hover:bg-horvath-900 text-horvath-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:border-horvath-900 transition-all flex items-center gap-2 group/link w-full sm:w-auto justify-center"
         >
           Configure
           <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
         </Link>
      </div>
    </div>
  );
}
