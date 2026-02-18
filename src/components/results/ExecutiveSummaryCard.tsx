'use client';

import * as React from 'react';
import { NarrativeModel } from '@/lib/narrative/generate';
import { Target, Zap, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export function ExecutiveSummaryCard({ model }: { model: NarrativeModel }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-sans">
      {/* Header Profile */}
      <div className="p-10 bg-slate-50/50 border-b border-slate-100">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-horvath-primary rounded-full" />
            <span className="text-[10px] font-black text-horvath-primary uppercase tracking-[0.3em]">
               Strategic Intelligence Directive
            </span>
         </div>
         
         <h2 className="text-4xl font-black text-horvath-dark tracking-tighter uppercase leading-[0.9] mb-6">
            {model.headline}
         </h2>
         
         <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-4xl">
            {model.executiveSummary}
         </p>
      </div>

      <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Strategic Priorities */}
         <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
               <Target className="w-4 h-4 text-slate-400" />
               <h3 className="text-xs font-black text-horvath-dark uppercase tracking-widest">Critical Priorities</h3>
            </div>
            <div className="space-y-4">
               {model.priorities.map((p, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                     <span className="text-sm font-black text-horvath-primary font-mono">{idx + 1}.</span>
                     <div>
                        <h4 className="text-sm font-black text-horvath-dark uppercase mb-1">{p.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.why}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Intervention Matrix */}
         <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
               <Zap className="w-4 h-4 text-slate-400" />
               <h3 className="text-xs font-black text-horvath-dark uppercase tracking-widest">Intervention Matrix</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
               {model.quickWins.map((win, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-tight">
                     <div className="w-1.5 h-1.5 bg-horvath-primary rounded-full" />
                     {win}
                  </div>
               ))}
            </div>

            {model.notes.length > 0 && (
               <div className="mt-8 p-6 bg-horvath-dark text-white rounded-xl shadow-md flex gap-4 items-start">
                  <ShieldAlert className="w-5 h-5 text-horvath-primary shrink-0" />
                  <div className="space-y-2">
                     {model.notes.map((note, idx) => (
                        <p key={idx} className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-relaxed">
                           {note}
                        </p>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
