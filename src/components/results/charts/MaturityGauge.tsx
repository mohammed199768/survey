'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface MaturityGaugeProps {
  score: number;           // Current score (1.0 - 5.0)
  targetScore?: number;    // Target score (1.0 - 5.0)
  date?: string;
  title?: string;
}

export function MaturityGauge({ 
  score, 
  targetScore,
  date = new Date().toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }),
  title = 'Overall Assessment Score'
}: MaturityGaugeProps) {
  
  const maturityLevels = useMemo(() => [
    { value: 5.0, label: 'LEADING', color: '#10b981' },    // emerald
    { value: 4.0, label: 'ADVANCED', color: '#8b5cf6' },   // violet
    { value: 3.0, label: 'READY', color: '#3b82f6' },      // blue
    { value: 2.0, label: 'EXPLORING', color: '#f59e0b' }, // amber
    { value: 1.0, label: 'BEGINNER', color: '#ec4899' },  // pink
  ], []);
  
  // Convert score (1-5) to percentage (0-100%)
  const scorePercent = ((score - 1) / 4) * 100;
  const targetPercent = targetScore ? ((targetScore - 1) / 4) * 100 : null;
  
  // Ensure circle stays within bounds
  const clampedScore = Math.max(1.0, Math.min(5.0, score));
  const clampedPercent = ((clampedScore - 1) / 4) * 100;
  
  return (
    <div className="flex flex-col items-center">
      
      <div className="flex items-center justify-center gap-8">
        
        {/* Left: Scale Labels */}
        <div className="flex flex-col justify-between h-80 text-sm text-gray-500 font-medium py-2">
          {[5.0, 4.0, 3.0, 2.0, 1.0].map(val => (
            <div key={val} className="text-right leading-none">{val.toFixed(1)}</div>
          ))}
        </div>
        
        {/* Center: Gauge Bar */}
        <div className="relative h-80 w-16">
          
          {/* Background Bar (Light Gray) */}
          <div className="absolute inset-0 bg-gray-100 rounded-full" />
          
          {/* Filled Bar (Pink to Purple Gradient) */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-500 via-purple-500 to-violet-500 rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${scorePercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          
          {/* Target Indicator (Blue Line) */}
          {targetPercent !== null && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-blue-500 z-0"
              style={{ bottom: `${targetPercent}%` }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              {/* Optional: Small circles at line ends */}
              <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
              <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
            </motion.div>
          )}
          
          {/* Score Indicator (White Circle INSIDE bar) */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-16 h-16 z-10"
            style={{ bottom: `calc(${clampedPercent}% - 2rem)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.2, type: 'spring', bounce: 0.4 }}
          >
            <div className="w-full h-full rounded-full bg-white shadow-lg border-4 border-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold text-purple-700">
                {clampedScore.toFixed(1)}
              </span>
            </div>
          </motion.div>
          
        </div>
        
        {/* Right: Maturity Level Labels */}
        <div className="flex flex-col justify-between h-80 text-sm py-2">
          {maturityLevels.map(level => (
            <div 
              key={level.value}
              className={`font-medium leading-none ${
                score >= level.value 
                  ? 'text-gray-900' 
                  : 'text-gray-400'
              }`}
            >
              {level.label}
            </div>
          ))}
        </div>
        
      </div>
      
      {/* Footer: Date */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span className="text-2xl font-bold">{score.toFixed(1)}</span>
      </div>
      
    </div>
  );
}

