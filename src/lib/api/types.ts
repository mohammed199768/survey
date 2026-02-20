/**
 * API Response Type Definitions
 * These match the backend response structures exactly
 */

export interface AssessmentResponse {
  id: string;
  version: number;
  title: string;
  description: string;
  estimated_duration_minutes?: number;
}

export interface TopicStructure {
  id: string;
  topicKey: string;
  label: string;
  prompt: string;
  orderIndex: number;
  helpText?: string;
  level_1_label?: string | null;
  level_2_label?: string | null;
  level_3_label?: string | null;
  level_4_label?: string | null;
  level_5_label?: string | null;
  levelAnchors: (string | null)[];
}

export interface DimensionStructure {
  id: string;
  dimensionKey: string;
  title: string;
  description?: string;
  category?: string;
  orderIndex: number;
  topics: TopicStructure[];
}

export interface AssessmentStructureResponse {
  assessment: AssessmentResponse;
  dimensions: DimensionStructure[];
}

export interface RegistrationData {
  email: string;
  fullName: string;
  companyName: string;
  jobTitle?: string;
  consentGiven: boolean;
}

export interface ParticipantResponse {
  success: boolean;
  data: {
    participantId: string;
    email: string;
    fullName: string;
    participantToken?: string;
    message?: string;
  };
}

export interface StartResponseResponse {
  success: boolean;
  data: {
    responseId: string;
    sessionToken: string;
  };
}

export interface AnswerData {
  topicId: string;
  currentRating: number;
  targetRating: number;
  timeSpentSeconds?: number;
  notes?: string;
}

export interface AnswerResponse {
  success: boolean;
  data: {
    topicResponseId: string;
    gap: number;
    normalizedGap: number;
    progress: number;
  };
}

export interface SessionData {
  success: boolean;
  data: {
    responseId: string;
    status: string;
    progress: number;
    answeredTopics: Array<{
      topicId: string;
      currentRating: number;
      targetRating: number;
      gap: number;
    }>;
  };
}

export interface CompleteResponse {
  success: boolean;
  data: {
    responseId: string;
    completedAt: string;
    overallScore: number;
    overallGap: number;
  };
}

export interface DimensionResult {
  dimensionKey: string;
  title: string;
  score: number;
  gap: number;
  priorityScore: number;
  recommendations: TopicRecommendation[];
  topics: unknown[];
}

export type TopicRecommendation = {
  id: string;
  topicId: string;
  scoreMin: number | null;
  scoreMax: number | null;
  targetMin: number | null;
  targetMax: number | null;
  gapMin: number | null;
  gapMax: number | null;
  title: string;
  description: string | null;
  why: string | null;
  what: string | null;
  how: string | null;
  actionItems: string[];
  category: 'Quick Win' | 'Project' | 'Big Bet';
  priority: number;
  tags: string[];
  isActive: boolean;
  orderIndex: number;
};

export type ResultsDimension = DimensionResult;

export interface TopGap {
  topicId: string;
  label: string;
  gap: number;
  dimensionTitle: string;
}

export interface Priority {
  dimensionKey: string;
  title: string;
  priorityScore: number;
  rank: number;
}

export interface ResultsDataResponse {
  success: boolean;
  data: ResultsData;
}

export interface ResultsData {
  overallScore: number;
  overallGap: number;
  maturityLevel?: string;
  dimensions: ResultsDimension[];
  topGaps: TopGap[];
  priorities: Priority[];
  topRecommendations: TopicRecommendation[];
}

export interface RecommendationItem {
  title: string;
  description: string;
  actionItems: string[];
  resources: Array<{
    title: string;
    url: string;
    type?: string;
  }>;
}

export interface DimensionRecommendation {
  dimensionKey: string;
  dimensionTitle: string;
  priorityScore: number;
  items: RecommendationItem[];
}

export interface RecommendationsData {
  recommendations: DimensionRecommendation[];
}

// ==========================================
// Recommendation Types (FROM API)
// ==========================================

export interface RecommendationRuleAPI {
  id: string;
  title: string;
  description: string;
  conditions: {
    gapMin?: number;
    gapMax?: number;
    maturityBelow?: number;
    maturityAbove?: number;
  };
  why?: string;
  what?: string;
  how?: string;
  priority: number;
  tags: string[];
  impactLevel?: string;
  effortLevel?: string;
  timeframe?: string;
  actionItems?: Array<{
    id: string;
    text: string;
    category?: string;
  }>;
  resources?: Array<{
    title: string;
    url?: string;
    type?: string;
  }>;
  kpis?: string[];
}

export interface RecommendationsDefinitionAPI {
  dimensions: Array<{
    dimensionKey: string;
    recommendations: RecommendationRuleAPI[];
  }>;
  meta: {
    dimensionColors: Record<string, string>;
    dimensionWeights: Record<string, number>;
    themeMap: Record<string, string>;
    priorityWeights?: Record<string, number>;
    urgencyTags?: string[];
    dimensionOrder?: string[];
    titleTemplates?: Record<string, string[]>;
    descriptionTemplate?: string;
  };
}

// ==========================================
// Narrative Types (FROM API)
// ==========================================

export interface NarrativeDefinitionAPI {
  version: number;
  themeMap: Record<string, string>;
  maturityThresholds: Record<string, number>;
  maturityLabels?: string[];
  gapThresholds?: {
    minor: number;
    moderate: number;
    significant: number;
  };
  headlines?: {
    lowConfidencePrefix: string;
    byStageId: Record<string, string>;
  };
  executiveSummary?: {
    sentence1: string;
    sentence2: string;
    sentence3: string;
  };
  stageRationale?: string;
  priorityWhyTemplate?: string;
  notes?: Record<string, string>;
  executiveTemplates: {
    maturityLevel: Record<string, string>;
    gapAnalysis: {
      large: string;
      moderate: string;
      minimal: string;
    };
    strengths: {
      multiple: string;
      single: string;
    };
    priorities: {
      high: string;
      balanced: string;
    };
  };
  dimensionTemplates?: Record<string, string[]>;
  gapTemplates?: Record<string, string[]>;
}

// ==========================================
// Backward-Compatible Type Aliases
// ==========================================

// For backward compatibility with existing components
export type ParticipantData = RegistrationData;
export type ParticipantResponseData = ParticipantResponse['data'];
export type StartResponseData = StartResponseResponse['data'];
export type SessionDataInner = SessionData['data'];
export type AnswerResponseData = AnswerResponse['data'];
export type CompleteResponseData = CompleteResponse['data'];

// Re-export for components expecting these types
export type { 
  NarrativeDefinitionAPI as NarrativeDefinition,
  RecommendationsDefinitionAPI as RecommendationsDefinition
};
