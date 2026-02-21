'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AssessmentDefinition } from '@/lib/assessment/validate';
import { DimensionResultModel } from '@/lib/scoring/compute';
import { formatScore } from '@/lib/scoring/number';

interface MaturityRadarProps {
  definition: AssessmentDefinition;
  dimensions: DimensionResultModel[];
}

export function MaturityRadar({ definition, dimensions }: MaturityRadarProps) {
  const titleId = React.useId();
  const descId = React.useId();
  const CENTER = 160;
  const RADIUS = 110;
  const GRID_LEVELS = [1, 2, 3, 4, 5];
  
  const currentValues = dimensions.map(d => d.currentAvg || 0);
  const targetValues = dimensions.map(d => d.targetAvg || 0);
  
  const angleStep = (Math.PI * 2) / dimensions.length;
  const angles = dimensions.map((_, i) => i * angleStep - Math.PI / 2);

  const getPoints = (values: number[]) => {
    return values
      .map((val, i) => {
        const r = (RADIUS * val) / 5;
        const x = CENTER + Math.cos(angles[i]) * r;
        const y = CENTER + Math.sin(angles[i]) * r;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const currentPoints = getPoints(currentValues);
  const targetPoints = getPoints(targetValues);

  return (
    <div className="relative w-full aspect-square max-w-[320px] mx-auto font-sans">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>Maturity radar chart</title>
        <desc id={descId}>
          Radar visualization for score and target maturity levels across the six readiness dimensions.
        </desc>
        {/* Concentric Grid Lines (Ultra-thin Slate) */}
        {GRID_LEVELS.map((level) => (
          <circle
            key={level}
            cx={CENTER}
            cy={CENTER}
            r={(RADIUS * level) / 5}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.5"
          />
        ))}

        {/* Radial Axis Lines */}
        {angles.map((angle, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={CENTER + Math.cos(angle) * RADIUS}
            y2={CENTER + Math.sin(angle) * RADIUS}
            stroke="#E2E8F0"
            strokeWidth="0.5"
          />
        ))}

        {/* Current State Area (Primary Blue Flat) */}
        <motion.polygon
          points={currentPoints}
          fill="#3a92c6"
          fillOpacity="0.08"
          stroke="#3a92c6"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Target Ambition Line (Slate Grey Dashed) */}
        <motion.polygon
          points={targetPoints}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="2,2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />

        {/* Data Points (Solid Blue) */}
        {dimensions.map((_, i) => (
          <circle
            key={i}
            cx={CENTER + Math.cos(angles[i]) * ((RADIUS * currentValues[i]) / 5)}
            cy={CENTER + Math.sin(angles[i]) * ((RADIUS * currentValues[i]) / 5)}
            r="3"
            fill="#3a92c6"
          />
        ))}

        {/* Labels - Arial hierarchy */}
        {dimensions.map((dim, i) => {
          const x = CENTER + Math.cos(angles[i]) * (RADIUS + 30);
          const y = CENTER + Math.sin(angles[i]) * (RADIUS + 30);
          return (
            <foreignObject
              key={dim.id}
              x={x - 45}
              y={y - 15}
              width="90"
              height="30"
              style={{ overflow: 'visible' }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  {dim.title.split(' ')[0]}
                </span>
                <span className="text-[10px] font-black text-horvath-900 font-mono">
                  {formatScore(currentValues[i])}
                </span>
              </div>
            </foreignObject>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-horvath-700 rounded-sm shadow-sm" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 border border-slate-400 border-dashed rounded-sm" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Target</span>
        </div>
      </div>
    </div>
  );
}
