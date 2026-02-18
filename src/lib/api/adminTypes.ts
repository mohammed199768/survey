/**
 * Admin API Type Definitions
 * Types for admin dashboard, authentication, and management features
 */

// ==========================================
// Authentication Types
// ==========================================

export interface AdminUser {
  userId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
}

export interface AdminVerifyResponse {
  valid: boolean;
  user?: AdminUser;
  error?: string;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardStats {
  active_assessments: number;
  total_responses: number;
  completed_responses: number;
  in_progress_responses: number;
  total_participants: number;
  active_participants: number;
  avg_overall_score: number;
  avg_overall_gap: number;
  completion_rate: number;
}

export interface DashboardActivityItem {
  id: string;
  type: 'response';
  status: string;
  timestamp: string;
  participant_name: string;
  company_name: string;
  assessment_title: string;
}

export interface DashboardDimensionStats {
  title: string;
  avg_score?: number;
  avg_gap?: number;
  avg_priority?: number;
}

export interface DashboardIndustryStats {
  industry: string;
  total: number;
  completed: number;
  completion_rate: number;
  avg_score: number;
}

export interface DashboardRecentCompletion {
  id: string;
  completed_at: string;
  overall_score: number;
  full_name: string;
  company_name: string;
  industry: string;
}

export interface DashboardData {
  overview: DashboardStats;
  recentActivity: DashboardActivityItem[];
  topDimensions: DashboardDimensionStats[];
  bottomDimensions: DashboardDimensionStats[];
  industryStats: DashboardIndustryStats[];
  recentCompletions: DashboardRecentCompletion[];
}

// ==========================================
// Assessment Types
// ==========================================

export interface AssessmentTopic {
  id: string;
  key: string;
  label: string;
  prompt: string;
  help_text?: string;
  order: number;
  level_1_label?: string | null;
  level_2_label?: string | null;
  level_3_label?: string | null;
  level_4_label?: string | null;
  level_5_label?: string | null;
}

export interface AssessmentDimension {
  id: string;
  key: string;
  title: string;
  description?: string;
  category: string;
  order: number;
  topics: AssessmentTopic[];
}

export interface AssessmentListItem {
  id: string;
  title: string;
  description?: string;
  version: number;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  created_by_name?: string;
  dimension_count: number;
  topic_count: number;
  response_count: number;
}

export interface AssessmentWithDimensions {
  id: string;
  title: string;
  description?: string;
  version: number;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  dimensions: AssessmentDimension[];
}

export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  version: number;
  dimensions: {
    key: string;
    title: string;
    description?: string;
    category: string;
    order: number;
    topics: {
      key: string;
      label: string;
      prompt: string;
      help_text?: string;
      order: number;
    }[];
  }[];
}

export interface AssessmentResponse {
  id: string;
  message?: string;
}

// ==========================================
// Response Types
// ==========================================

export interface ResponseListItem {
  id: string;
  assessment_id: string;
  participant_id: string;
  status: 'in_progress' | 'completed';
  overall_score: number;
  overall_gap: number;
  started_at: string;
  completed_at?: string;
  last_updated_at: string;
  full_name: string;
  email: string;
  company_name: string;
  assessment_title: string;
}

export interface TopicAnswer {
  id: string;
  topic_id: string;
  current_rating: number;
  target_rating: number;
  gap: number;
  notes?: string;
  answered_at: string;
  time_spent_seconds?: number;
  label: string;
  dimension_title: string;
}

export interface PriorityScore {
  id: string;
  dimension_id: string;
  dimension_score: number;
  dimension_gap: number;
  priority_score: number;
  rank_order: number;
  dimension_title: string;
  recommendations?: PriorityRecommendation[];
}

export interface PriorityRecommendation {
  id: string;
  topicId: string;
  topicKey?: string;
  title: string;
  description: string | null;
  why: string | null;
  what: string | null;
  how: string | null;
  action_items: string[];
  category: 'Quick Win' | 'Project' | 'Big Bet';
  priority: number;
  tags: string[];
}

export interface ResponseDetail {
  response: ResponseListItem;
  answers: TopicAnswer[];
  priorities: PriorityScore[];
}

export interface ResponseListParams {
  page?: number;
  limit?: number;
  status?: string;
  assessment_id?: string;
  search?: string;
}

// ==========================================
// Pagination Types
// ==========================================

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ==========================================
// Analytics Types
// ==========================================

export interface DimensionPerformance {
  title: string;
  category: string;
  avg_score: number;
  avg_gap: number;
  min_score: number;
  max_score: number;
}

export interface ResponseTrend {
  date: string;
  count: number;
  avg_score: number;
}

export interface ScoreDistributionBucket {
  range: '1-2' | '2-3' | '3-4' | '4-5';
  label: string;
  count: number;
}

export interface AnalyticsData {
  dimension_performance: DimensionPerformance[];
  response_trends: ResponseTrend[];
  score_distribution: ScoreDistributionBucket[];
  generated_at: string;
}

export interface AnalyticsDimensionBreakdown {
  title: string;
  category: string;
  avg_score: number;
  avg_gap: number;
  min_score: number;
  max_score: number;
}

export interface ExportResponse {
  response_id: string;
  full_name: string;
  email: string;
  company_name: string;
  overall_score: number;
  overall_gap: number;
  completed_at: string;
}

// ==========================================
// Recommendations Types (Admin Management)
// ==========================================

export interface RecommendationResource {
  title: string;
  url: string;
  type?: string;
}

export interface AdminRecommendation {
  id: string;
  dimension_id: string;
  dimension_title: string;
  title: string;
  description: string;
  action_items: string[];
  resources: RecommendationResource[];
  min_gap: number;
  max_gap: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
  updated_at?: string;
}

export interface CreateRecommendationRequest {
  dimension_id: string;
  title: string;
  description: string;
  action_items: string[];
  resources?: RecommendationResource[];
  min_gap: number;
  max_gap: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpdateRecommendationRequest extends CreateRecommendationRequest {
  id: string;
}

// ==========================================
// API Response Wrappers
// ==========================================

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AdminApiError {
  success: false;
  error: string;
  details?: unknown;
}

export interface TopicLevelsResponse {
  topicId: string;
  level1Label: string | null;
  level2Label: string | null;
  level3Label: string | null;
  level4Label: string | null;
  level5Label: string | null;
}

export interface UpdateTopicLevels {
  level1Label: string;
  level2Label: string;
  level3Label: string;
  level4Label: string;
  level5Label: string;
}

export interface TopicRecommendation {
  id: string;
  topic_id: string;
  score_min: number | null;
  score_max: number | null;
  target_min: number | null;
  target_max: number | null;
  gap_min: number | null;
  gap_max: number | null;
  title: string;
  description: string | null;
  why: string | null;
  what: string | null;
  how: string | null;
  action_items: string[];
  category: 'Quick Win' | 'Project' | 'Big Bet';
  priority: number;
  tags: string[];
  is_active: boolean;
  order_index: number;
}

export interface CreateTopicRec {
  score_min?: number | null;
  score_max?: number | null;
  target_min?: number | null;
  target_max?: number | null;
  gap_min?: number | null;
  gap_max?: number | null;
  title: string;
  description?: string | null;
  why?: string | null;
  what?: string | null;
  how?: string | null;
  action_items?: string[];
  category?: 'Quick Win' | 'Project' | 'Big Bet';
  priority?: number;
  tags?: string[];
  is_active?: boolean;
  order_index?: number;
}
