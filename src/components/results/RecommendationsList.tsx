'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { EnhancedRecommendation } from '@/lib/recommendations/definition';

interface RecommendationsListProps {
  recommendations: EnhancedRecommendation[];
  selectedRank?: number | null;
  highlightedDimension?: string | null;
  onRecommendationClick?: (rank: number) => void;
}

export function RecommendationsList({
  recommendations,
  selectedRank = null,
  highlightedDimension = null,
  onRecommendationClick,
}: RecommendationsListProps) {
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand selected recommendation
  useEffect(() => {
    if (selectedRank !== null) {
      const rec = recommendations.find((r) => r.rank === selectedRank);
      if (rec && !expandedIds.has(rec.id)) {
        setExpandedIds((prev) => { const a = Array.from(prev); a.push(rec.id); return new Set(a); });
      }
    }
  }, [selectedRank, recommendations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand highlighted dimension recommendations
  useEffect(() => {
    if (highlightedDimension) {
      const dimRecs = recommendations.filter(
        (r) => r.dimension === highlightedDimension
      );
      setExpandedIds((prev) => {
        const next = new Set(prev);
        dimRecs.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }, [highlightedDimension, recommendations]);

  const toggleAll = () => {
    if (expandedAll) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(recommendations.map((r) => r.id)));
    }
    setExpandedAll(!expandedAll);
  };

  const toggleItem = (id: string, rank: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onRecommendationClick?.(rank);
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center py-12">
          <p className="text-gray-500">Generating recommendations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
        <button
          onClick={toggleAll}
          className="px-4 py-2 text-sm font-medium text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
        >
          {expandedAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Category header */}
      <div className="text-right text-xs text-gray-500 mb-3 pr-10">Category</div>

      {/* List */}
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const isSelected = selectedRank === rec.rank;
          const isDimmed = highlightedDimension
            ? rec.dimension !== highlightedDimension
            : false;

          return (
            <RecommendationItem
              key={rec.id}
              recommendation={rec}
              isExpanded={expandedIds.has(rec.id)}
              isSelected={isSelected}
              isDimmed={isDimmed}
              onToggle={() => toggleItem(rec.id, rec.rank)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Single Item ──────────────────────────────────────────────────────────────

interface RecommendationItemProps {
  recommendation: EnhancedRecommendation;
  isExpanded: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onToggle: () => void;
}

function RecommendationItem({
  recommendation,
  isExpanded,
  isSelected,
  isDimmed,
  onToggle,
}: RecommendationItemProps) {
  const { rank, title, description, category, color } = recommendation;

  return (
    <div
      id={`recommendation-${rank}`}
      className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-4 ring-blue-300' : ''
      }`}
      style={{
        borderColor: isExpanded ? color : '#e5e7eb',
        opacity: isDimmed ? 0.45 : 1,
      }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform duration-200"
          style={{
            backgroundColor: color,
            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          {rank}
        </div>

        {/* Title */}
        <span className="flex-1 text-left font-medium text-gray-900 text-sm">
          {title}
        </span>

        {/* Category */}
        <span className="flex-shrink-0 text-xs text-gray-600 mr-2">{category}</span>

        {/* Chevron */}
        <ChevronDown
          className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 bg-gray-50">
              <p className="text-sm text-gray-700 leading-relaxed">
                {description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
