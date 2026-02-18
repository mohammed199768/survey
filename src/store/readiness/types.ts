export type DimensionSlug = string;
export type TopicId = string;

export type ScoreValue = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface TopicScore {
  current: ScoreValue;
  target: ScoreValue;
}

export interface ReadinessState {
  scores: Record<DimensionSlug, Record<TopicId, TopicScore>>;
  touched: Record<DimensionSlug, Record<TopicId, boolean>>;
  completion: Record<DimensionSlug, boolean>;
  
  setScore: (payload: {
    dimensionId: DimensionSlug;
    topicId: TopicId;
    field: 'current' | 'target';
    value: number; // Relaxed from ScoreValue to allow raw input, coerced internally
  }) => void;
  
  markDimensionComplete: (dimensionId: DimensionSlug, done: boolean) => void;
  
  initDimensionIfNeeded: (payload: {
    dimensionId: string;
    topicIds: string[];
    defaults?: Partial<TopicScore>;
  }) => void;
  
  resetAll: () => void;
  resetAndClearStorage: () => void;
}
