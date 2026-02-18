'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  color?: 'blue' | 'indigo' | 'purple' | 'gray';
  disabled?: boolean;
}

const colors = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  purple: 'bg-purple-600',
  gray: 'bg-gray-600',
};

const trackColors = {
  blue: 'bg-blue-100',
  indigo: 'bg-indigo-100',
  purple: 'bg-purple-100',
  gray: 'bg-gray-200',
};

export function Slider({
  value,
  min = 1,
  max = 5,
  step = 0.5,
  onChange,
  label,
  color = 'blue',
  disabled = false,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}</span>
        </div>
      )}
      
      <div className="relative w-full h-6 flex items-center select-none touch-none">
        {/* Track */}
        <div className={`absolute w-full h-2 rounded-full overflow-hidden ${trackColors[color]}`}>
           {/* Animated Fill */}
           <motion.div
            className={`h-full ${colors[color]}`}
            initial={{ width: `${clampedPercentage}%` }}
            animate={{ width: `${clampedPercentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Input - invisible but accessible */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Thumb (Visual Only - follows percentage with proper clamping) */}
        <motion.div
           className={`absolute w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-sm pointer-events-none z-0`}
           style={{ 
             left: `calc(${clampedPercentage}% - 8px)`,
             // Ensure thumb stays within bounds
             transform: clampedPercentage <= 0 ? 'translateX(0)' : 
                       clampedPercentage >= 100 ? 'translateX(-8px)' : 'none'
           }}
           animate={{ 
             left: `calc(${clampedPercentage}% - 8px)` 
           }}
           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {/* Ticks (Visual Guide) */}
        <div className="absolute w-full h-full pointer-events-none flex justify-between px-[2px]">
           {Array.from({ length: (max - min) + 1 }).map((_, i) => (
             <div key={i} className="w-[1px] h-full" /> 
           ))}
        </div>
      </div>
       
      <div className="flex justify-between mt-1 text-xs text-gray-400 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}