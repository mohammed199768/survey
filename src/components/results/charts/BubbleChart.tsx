'use client';

import { useState, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { RecommendationBubble } from '@/lib/recommendations/definition';

type LegendItem = {
  id: string;
  name: string;
  color: string;
};

interface BubbleChartProps {
  bubbles: RecommendationBubble[];
  overallScore: number;
  date?: string;
  legendItems?: LegendItem[];
  selectedRank?: number | null;
  highlightedDimension?: string | null;
  onBubbleClick?: (rank: number) => void;
  onLegendClick?: (dimensionId: string) => void;
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

const DEFAULT_LEGEND: LegendItem[] = [
  { id: 'strategy', name: 'Strategy', color: SEMANTIC_COLORS.success },
  { id: 'value', name: 'Value', color: '#f97316' },
  { id: 'data', name: 'Data', color: BRAND_COLORS.secondary },
  { id: 'technology', name: 'Technology', color: BRAND_COLORS.primary },
  { id: 'capabilities', name: 'Capabilities', color: '#8b5cf6' },
  { id: 'governance', name: 'Governance', color: '#ec4899' },
];

export function BubbleChart({
  bubbles,
  overallScore,
  date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
  legendItems = DEFAULT_LEGEND,
  selectedRank = null,
  highlightedDimension = null,
  onBubbleClick,
  onLegendClick,
}: BubbleChartProps) {
  const titleId = useId();
  const descId = useId();
  const chartWidth = 560;
  const chartHeight = 380;
  const padding = 44;

  const xScale = (v: number) => padding + (v / 10) * (chartWidth - 2 * padding);
  const yScale = (v: number) => chartHeight - padding - (v / 10) * (chartHeight - 2 * padding);

  const ticks = useMemo(() => [0, 2, 4, 6, 8, 10], []);
  const displacedBubbles = useMemo(() => {
    const groups = new Map<string, RecommendationBubble[]>();
    for (const bubble of bubbles) {
      const key = `${bubble.x.toFixed(2)}:${bubble.y.toFixed(2)}`;
      const bucket = groups.get(key) || [];
      bucket.push(bubble);
      groups.set(key, bucket);
    }

    const offsets = new Map<string, { dx: number; dy: number }>();
    for (const bucket of Array.from(groups.values())) {
      if (bucket.length === 1) {
        offsets.set(bucket[0].id, { dx: 0, dy: 0 });
        continue;
      }

      const spread = Math.max(10, bucket[0].size * 0.35);
      bucket.forEach((bubble, idx) => {
        const angle = (2 * Math.PI * idx) / bucket.length;
        offsets.set(bubble.id, {
          dx: Math.cos(angle) * spread,
          dy: Math.sin(angle) * spread,
        });
      });
    }

    return bubbles.map((bubble) => ({
      bubble,
      offset: offsets.get(bubble.id) || { dx: 0, dy: 0 },
    }));
  }, [bubbles]);

  const colorByLegendId = useMemo(() => {
    const map = new Map<string, string>();
    legendItems.forEach((item) => map.set(item.id, item.color));
    return map;
  }, [legendItems]);

  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  if (bubbles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center py-12">
          <p className="text-gray-500">Generating recommendations...</p>
        </div>
      </div>
    );
  }

  const highlightedColor = highlightedDimension
    ? colorByLegendId.get(highlightedDimension) || null
    : null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bubble Chart</h3>

      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="overflow-visible"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>Recommendation priority bubble chart</title>
        <desc id={descId}>
          X axis shows urgency, Y axis shows importance, and bubble size represents resource need.
        </desc>

        {ticks.map((v) => (
          <line
            key={`gv-${v}`}
            x1={xScale(v)}
            y1={padding}
            x2={xScale(v)}
            y2={chartHeight - padding}
            stroke="#b6d5eb"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {ticks.map((v) => (
          <line
            key={`gh-${v}`}
            x1={padding}
            y1={yScale(v)}
            x2={chartWidth - padding}
            y2={yScale(v)}
            stroke="#b6d5eb"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#374151"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#374151"
          strokeWidth="2"
        />

        {ticks.map((v) => (
          <text
            key={`xl-${v}`}
            x={xScale(v)}
            y={chartHeight - padding + 18}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
          >
            {v}
          </text>
        ))}

        {ticks.map((v) => (
          <text
            key={`yl-${v}`}
            x={padding - 16}
            y={yScale(v) + 4}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
          >
            {v}
          </text>
        ))}

        {displacedBubbles.map(({ bubble: b, offset }, i) => {
          const isSelected = selectedRank === b.rank;
          const isHovered = hoveredRank === b.rank;
          const active = isSelected || isHovered;
          const isDimmed = highlightedColor ? b.color !== highlightedColor : false;
          const cx = xScale(b.x) + offset.dx;
          const cy = yScale(b.y) + offset.dy;

          return (
            <motion.g
              key={b.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isDimmed ? 0.25 : 1,
                scale: active ? 1.15 : 1,
              }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              style={{ cursor: 'pointer', transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => setHoveredRank(b.rank)}
              onMouseLeave={() => setHoveredRank(null)}
              onClick={() => onBubbleClick?.(b.rank)}
            >
              {active && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={b.size / 2 + 5}
                  fill="none"
                  stroke={b.color}
                  strokeWidth="3"
                  opacity={0.6}
                />
              )}

              <circle cx={cx} cy={cy} r={b.size / 2} fill={b.color} opacity={active ? 0.92 : 0.72} />

              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="bold"
                fill="white"
                className="pointer-events-none select-none"
              >
                {b.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-4 mt-2 px-2 text-xs text-gray-500">
        <span>x-axis: urgency</span>
        <span>y-axis: importance</span>
        <span>bubble size: resource need</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3 text-sm">
        <span className="text-gray-600">Overall:</span>
        <span className="font-semibold text-gray-900">Score {overallScore.toFixed(1)}</span>
        <span className="text-gray-400">📅</span>
        <span className="text-gray-600">{date}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {legendItems.map((d) => {
          const isActive = highlightedDimension === d.id;
          const isDimmedLegend = highlightedDimension && !isActive;

          return (
            <button
              key={d.id}
              onClick={() => onLegendClick?.(d.id)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                isActive ? 'bg-horvath-50 ring-2 ring-horvath-700' : 'hover:bg-gray-50'
              }`}
              style={{ opacity: isDimmedLegend ? 0.45 : 1 }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-gray-600 font-medium">{d.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
