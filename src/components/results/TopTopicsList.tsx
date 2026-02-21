'use client';

import * as React from 'react';
import { TopTopic } from '@/lib/scoring/compute';
import { formatScore } from '@/lib/scoring/number';

interface TopTopicsListProps {
  topics: TopTopic[];
  maxItems?: number;
}

/**
 * Displays the top-N topics ranked by priority score.
 * Shows rank badge, topic label, risk level, and target score.
 */
export function TopTopicsList({ topics, maxItems = 10 }: TopTopicsListProps) {
  const display = topics.slice(0, maxItems);

  return (
    <div className="space-y-0">
      {display.map((topic, idx) => (
        <TopicRow key={topic.id} topic={topic} rank={idx + 1} />
      ))}

      {display.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          Complete the survey to see top topics.
        </div>
      )}
    </div>
  );
}

function TopicRow({ topic, rank }: { topic: TopTopic; rank: number }) {
  const riskColors: Record<string, string> = {
    high: 'text-rose-600 bg-rose-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      {/* Rank badge */}
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
          rank <= 3
            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {rank}
      </div>

      {/* Topic info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 truncate">{topic.label}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{topic.dimensionName}</span>
          <span
            className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${riskColors[topic.riskLevel]}`}
          >
            {topic.riskLevel}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-sm font-semibold text-horvath-700">
        {formatScore(topic.current)} / {formatScore(topic.target)}
      </div>
    </div>
  );
}
