'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { EnhancedRecommendation } from '@/lib/recommendations/definition';

interface PriorityMatrixProps {
  recommendations: EnhancedRecommendation[];
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

export function PriorityMatrix({ recommendations }: PriorityMatrixProps) {
  const sortedRecs = [...recommendations].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const topRecs = sortedRecs.slice(0, 12);
  
  const getPosition = (priority: number, index: number) => {
    const x = 30 + (index % 4) * 18;
    const y = 30 + Math.floor(index / 4) * 25;
    return { x, y };
  };
  
  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex-1 relative rounded-xl bg-slate-50 overflow-hidden" style={{ border: '1px solid rgba(29, 105, 150, 0.1)' }}>
        {/* Quadrant Labels */}
        <div className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-widest opacity-50" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.primary }}>High Impact</div>
        <div className="absolute bottom-2 left-2 text-[8px] font-bold uppercase tracking-widest opacity-50" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.primary }}>Low Impact</div>
        <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest opacity-50" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.secondary }}>Urgent</div>
        <div className="absolute bottom-2 right-2 text-[8px] font-bold uppercase tracking-widest opacity-50" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.secondary }}>Non-Urgent</div>
        
        {/* Center lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: 'rgba(29, 105, 150, 0.1)' }} />
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ backgroundColor: 'rgba(29, 105, 150, 0.1)' }} />
        
        {/* Priority Bubbles */}
        {topRecs.map((rec, idx) => {
          const priority = rec.priority || 0;
          const { x, y } = getPosition(priority, idx);
          const size = Math.max(30, Math.min(60, priority * 0.6));
          
          return (
            <motion.div
              key={rec.id}
              className="absolute rounded-full flex items-center justify-center cursor-pointer"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                backgroundColor: BRAND_COLORS.secondary,
                opacity: 0.85,
                boxShadow: '0 4px 12px rgba(29, 105, 150, 0.3)',
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.1, opacity: 1 }}
            >
              <span className="text-xs font-black text-white" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                {Math.round(priority)}
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {topRecs.slice(0, 4).map((rec, idx) => (
          <div key={rec.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border" style={{ borderColor: 'rgba(29, 105, 150, 0.2)' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS.secondary }} />
            <span className="text-[10px] font-bold uppercase truncate max-w-[120px]" style={{ fontFamily: 'Arial, sans-serif', color: BRAND_COLORS.primary }}>
              {rec.title.substring(0, 20)}...
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
