// Legacy localSource removed.
// Use useReadinessStore to access recommendations definition from API.

// ---------------------------------------------------------------------------
// Enhanced Recommendation Types (Phase 7)
// ---------------------------------------------------------------------------

export type RecommendationMetrics = {
  urgency: number;        // 0-10: How urgent is this recommendation
  importance: number;     // 0-10: How important strategically
  resourceNeed: number;   // 0-10: How many resources needed
  complexity: number;     // 0-10: Implementation complexity
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
};

export type EnhancedRecommendation = {
  id: string;
  rank: number;
  title: string;
  description: string;
  dimension: string;
  category: 'Quick Win' | 'Project' | 'Big Bet';
  metrics: RecommendationMetrics;
  link?: string;
  color: string;
  topics: string[];
  tags?: string[]; // Added for narrative generation (was topics)
  actions?: string[]; // Added for narrative generation
  gap?: number;      // Added for narrative generation
  priority?: number; // Added for narrative generation
  why?: string;
  what?: string;
  how?: string;
};

export type RecommendationBubble = {
  id: string;
  rank: number;
  x: number;          // Urgency (0-10)
  y: number;          // Importance (0-10)
  size: number;       // Resource need (px radius)
  color: string;      // Dimension color
  label: string;      // Rank number
};
