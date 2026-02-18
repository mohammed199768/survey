/**
 * Admin API Endpoint Functions
 * All backend admin API calls organized by feature
 * All endpoints require JWT authentication (except login)
 */

import * as AdminTypes from './adminTypes';
import { AdminAuthResponseSchema, AdminVerifyResponseSchema } from './schemas';
import { z } from 'zod';
import { API_BASE_URL } from '@/config/api';

const API_BASE = API_BASE_URL;
const CSRF_ENDPOINT = '/csrf-token';
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfToken: string | null = null;
const LOGIN_PATH = '/admin/login';

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const asNullableText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  return null;
};

const isEnvelopeLike = (value: unknown): value is { success?: unknown; error?: unknown; data?: unknown } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (obj: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

function shouldRedirectToLoginOn401(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentPath = window.location.pathname;
  return !currentPath.startsWith(LOGIN_PATH);
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE}${CSRF_ENDPOINT}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }

  const data = (await response.json()) as { csrfToken?: string };
  if (!data.csrfToken) {
    throw new Error('Missing CSRF token');
  }

  csrfToken = data.csrfToken;
  return data.csrfToken;
}

/**
 * Generic fetch wrapper for admin endpoints that return raw responses
 */
async function fetchAdmin<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (CSRF_METHODS.has(method)) {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && shouldRedirectToLoginOn401()) {
    window.location.href = '/admin/login';
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    csrfToken = null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const result = (await response.json()) as unknown;
  return schema ? schema.parse(result) : (result as T);
}

/**
 * Generic fetch wrapper for admin endpoints that return wrapped responses
 */
async function fetchAdminWrapped<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const response = await fetchAdmin<unknown>(endpoint, options);

  // Support both wrapped payloads ({ success, data }) and direct payloads (array/object).
  if (!isEnvelopeLike(response)) {
    return schema ? schema.parse(response) : (response as T);
  }

  // Unwrap only if this is explicitly an envelope contract.
  // Plain objects that happen to contain `data` (like paginated payloads) must stay intact.
  if (!hasOwn(response, 'success')) {
    return schema ? schema.parse(response) : (response as T);
  }

  const envelopeSchema = z.object({
    success: z.boolean().optional(),
    error: z.string().optional(),
    data: z.unknown().optional(),
  });
  const parsed = envelopeSchema.parse(response);

  if (parsed.success === false) {
    throw new Error(parsed.error || 'API returned error');
  }
  
  const payload = typeof parsed.data === 'undefined' ? response : parsed.data;
  return schema ? schema.parse(payload) : (payload as T);
}

// ==========================================
// Authentication Endpoints
// ==========================================

export const AdminAuthAPI = {
  /**
   * Login with email and password.
   * Uses direct fetch without Authorization header so an old token is never sent.
   */
  async login(credentials: AdminTypes.AdminLoginRequest): Promise<AdminTypes.AdminAuthResponse> {
    const res = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      let message = `API Error: ${res.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error) message = json.error;
      } catch {
        if (text) message = text;
      }
      throw new Error(message);
    }
    const response = (await res.json()) as unknown;
    return AdminAuthResponseSchema.parse(response);
  },

  /**
   * Logout and invalidate token
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      const response = await fetchAdminWrapped<{ success: boolean }>('/admin/auth/logout', {
        method: 'POST',
      });
      return response;
    } catch {
      return { success: true };
    }
  },

  /**
   * Verify current token is valid
   */
  async verify(): Promise<AdminTypes.AdminVerifyResponse> {
    const res = await fetch(`${API_BASE}/admin/auth/verify`, {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 401) {
      return { valid: false, error: 'Authentication required' };
    }

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API Error: ${res.status} - ${error}`);
    }

    const payload = (await res.json()) as unknown;
    return AdminVerifyResponseSchema.parse(payload);
  },

  /**
   * Cookie-based auth cannot be read from JS (HttpOnly),
   * so the source of truth is /verify.
   */
  isAuthenticated(): boolean {
    return true;
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return null;
  }
};

// ==========================================
// Dashboard Endpoints
// ==========================================

export const DashboardAPI = {
  /**
   * Get dashboard statistics
   * @param range - Optional time range: '30d', '90d', '1y', or 'all'
   */
  async getStats(range?: string): Promise<AdminTypes.DashboardData> {
    const params = range && range !== 'all' ? `?range=${range}` : '';
    const data = await fetchAdminWrapped<AdminTypes.DashboardData>(`/admin/dashboard/stats${params}`);

    return {
      ...data,
      overview: {
        active_assessments: asNumber(data?.overview?.active_assessments),
        total_responses: asNumber(data?.overview?.total_responses),
        completed_responses: asNumber(data?.overview?.completed_responses),
        in_progress_responses: asNumber(data?.overview?.in_progress_responses),
        total_participants: asNumber(data?.overview?.total_participants),
        active_participants: asNumber(data?.overview?.active_participants),
        avg_overall_score: asNumber(data?.overview?.avg_overall_score),
        avg_overall_gap: asNumber(data?.overview?.avg_overall_gap),
        completion_rate: asNumber(data?.overview?.completion_rate),
      },
      topDimensions: (data?.topDimensions || []).map((item) => ({
        ...item,
        avg_score: asNumber(item.avg_score),
        avg_gap: asNumber(item.avg_gap),
        avg_priority: asNumber(item.avg_priority),
      })),
      bottomDimensions: (data?.bottomDimensions || []).map((item) => ({
        ...item,
        avg_score: asNumber(item.avg_score),
        avg_gap: asNumber(item.avg_gap),
        avg_priority: asNumber(item.avg_priority),
      })),
      industryStats: (data?.industryStats || []).map((item) => ({
        ...item,
        total: asNumber(item.total),
        completed: asNumber(item.completed),
        completion_rate: asNumber(item.completion_rate),
        avg_score: asNumber(item.avg_score),
      })),
      recentCompletions: (data?.recentCompletions || []).map((item) => ({
        ...item,
        overall_score: asNumber(item.overall_score),
      })),
    };
  },

  /**
   * Get recent activity (last 24 hours)
   */
  async getActivity(): Promise<AdminTypes.DashboardActivityItem[]> {
    return fetchAdminWrapped<AdminTypes.DashboardActivityItem[]>('/admin/dashboard/activity');
  }
};

// ==========================================
// Assessment Endpoints
// ==========================================

export const AssessmentAdminAPI = {
  /**
   * Get all assessments
   */
  async list(): Promise<AdminTypes.AssessmentListItem[]> {
    return fetchAdminWrapped<AdminTypes.AssessmentListItem[]>('/admin/assessments');
  },

  /**
   * Get a single assessment with all dimensions and topics
   */
  async get(id: string): Promise<AdminTypes.AssessmentWithDimensions> {
    return fetchAdminWrapped<AdminTypes.AssessmentWithDimensions>(`/admin/assessments/${id}`);
  },

  /**
   * Create a new assessment
   */
  async create(data: AdminTypes.CreateAssessmentRequest): Promise<AdminTypes.AssessmentResponse> {
    return fetchAdminWrapped<AdminTypes.AssessmentResponse>('/admin/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing assessment (partial update)
   */
  async update(id: string, data: Partial<AdminTypes.CreateAssessmentRequest>): Promise<AdminTypes.AssessmentResponse> {
    return fetchAdminWrapped<AdminTypes.AssessmentResponse>(`/admin/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Publish or unpublish an assessment
   */
  async publish(id: string, isPublished: boolean): Promise<{ message: string }> {
    return fetchAdminWrapped<{ message: string }>(`/admin/assessments/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: isPublished }),
    });
  },

  /**
   * Delete an assessment
   */
  async delete(id: string): Promise<{ message: string }> {
    return fetchAdminWrapped<{ message: string }>(`/admin/assessments/${id}`, {
      method: 'DELETE',
    });
  }
};

// ==========================================
// Response Endpoints
// ==========================================

export const ResponseAdminAPI = {
  /**
   * Get paginated list of responses
   */
  async list(params?: AdminTypes.ResponseListParams): Promise<AdminTypes.PaginatedResponse<AdminTypes.ResponseListItem>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.assessment_id) queryParams.set('assessment_id', params.assessment_id);
    if (params?.search) queryParams.set('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/responses${queryString ? `?${queryString}` : ''}`;
    
    const result = await fetchAdminWrapped<AdminTypes.PaginatedResponse<AdminTypes.ResponseListItem>>(endpoint);
    const rows = Array.isArray(result?.data) ? result.data : [];
    const pagination = result?.pagination ?? {
      total: rows.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      pages: 1,
    };

    return {
      data: rows.map((row) => ({
        ...row,
        overall_score: asNumber(row.overall_score),
        overall_gap: asNumber(row.overall_gap),
      })),
      pagination: {
        total: asNumber(pagination.total),
        page: asNumber(pagination.page, 1),
        limit: asNumber(pagination.limit, 20),
        pages: asNumber(pagination.pages, 1),
      },
    };
  },

  /**
   * Get a single response with all details
   */
  async get(id: string): Promise<AdminTypes.ResponseDetail> {
    const result = await fetchAdminWrapped<AdminTypes.ResponseDetail>(`/admin/responses/${id}`);

    const response = result?.response ?? ({} as AdminTypes.ResponseListItem);
    const answers = Array.isArray(result?.answers) ? result.answers : [];
    const priorities = Array.isArray(result?.priorities) ? result.priorities : [];

    return {
      response: {
        ...response,
        overall_score: asNumber(response.overall_score),
        overall_gap: asNumber(response.overall_gap),
      },
      answers: answers.map((answer) => ({
        ...answer,
        current_rating: asNumber(answer.current_rating),
        target_rating: asNumber(answer.target_rating),
        gap: asNumber(answer.gap),
      })),
      priorities: priorities.map((priority) => ({
        ...priority,
        dimension_score: asNumber(priority.dimension_score),
        dimension_gap: asNumber(priority.dimension_gap),
        priority_score: asNumber(priority.priority_score),
        recommendations: Array.isArray(priority.recommendations)
          ? priority.recommendations.map((rawRec) => {
              const rec = rawRec as unknown as Record<string, unknown>;
              return {
              id: String(rec?.id ?? ''),
              topicId: String(rec?.topicId ?? rec?.topic_id ?? ''),
              topicKey: typeof rec?.topicKey === 'string'
                ? String(rec.topicKey)
                : typeof rec?.topic_key === 'string'
                  ? String(rec.topic_key)
                  : undefined,
              title: String(rec?.title ?? ''),
              description: asNullableText(rec?.description),
              why: asNullableText(rec?.why),
              what: asNullableText(rec?.what),
              how: asNullableText(rec?.how),
              action_items: Array.isArray(rec?.action_items)
                ? rec.action_items.map((item: unknown) => String(item))
                : Array.isArray(rec?.actionItems)
                  ? rec.actionItems.map((item: unknown) => String(item))
                  : [],
              category:
                rec?.category === 'Quick Win' || rec?.category === 'Project' || rec?.category === 'Big Bet'
                  ? (rec.category as 'Quick Win' | 'Project' | 'Big Bet')
                  : 'Project',
              priority: asNumber(rec?.priority),
              tags: Array.isArray(rec?.tags) ? rec.tags.map((tag: unknown) => String(tag)) : [],
            };
          })
          : [],
      })),
    };
  }
};

// ==========================================
// Analytics Endpoints
// ==========================================

export const AnalyticsAPI = {
  /**
   * Get analytics overview
   */
  async getOverview(): Promise<AdminTypes.AnalyticsData> {
    const data = await fetchAdminWrapped<AdminTypes.AnalyticsData>('/admin/analytics');

    return {
      ...data,
      dimension_performance: (data?.dimension_performance || []).map((item) => ({
        ...item,
        avg_score: asNumber(item.avg_score),
        avg_gap: asNumber(item.avg_gap),
        min_score: asNumber(item.min_score),
        max_score: asNumber(item.max_score),
      })),
      response_trends: (data?.response_trends || []).map((item) => ({
        ...item,
        count: asNumber(item.count),
        avg_score: asNumber(item.avg_score),
      })),
      score_distribution: (data?.score_distribution || []).map((item) => ({
        ...item,
        count: asNumber(item.count),
      })),
    };
  },

  /**
   * Get dimension breakdown analytics
   */
  async getDimensionBreakdown(): Promise<AdminTypes.AnalyticsDimensionBreakdown[]> {
    return fetchAdminWrapped<AdminTypes.AnalyticsDimensionBreakdown[]>('/admin/analytics/dimension-breakdown');
  },

  /**
   * Export responses data
   */
  async exportResponses(assessmentId?: string): Promise<AdminTypes.ExportResponse[]> {
    const params = assessmentId ? `?assessment_id=${assessmentId}` : '';
    return fetchAdminWrapped<AdminTypes.ExportResponse[]>(`/admin/analytics/export/responses${params}`);
  }
};

// ==========================================
// Recommendations Endpoints (Admin Management)
// ==========================================

export const RecommendationAdminAPI = {
  /**
   * Get all recommendations, optionally filtered by dimension
   */
  async list(dimensionId?: string): Promise<AdminTypes.AdminRecommendation[]> {
    const params = dimensionId ? `?dimension_id=${dimensionId}` : '';
    return fetchAdminWrapped<AdminTypes.AdminRecommendation[]>(`/admin/recommendations${params}`);
  },

  /**
   * Create a new recommendation
   */
  async create(data: AdminTypes.CreateRecommendationRequest): Promise<AdminTypes.AdminRecommendation> {
    return fetchAdminWrapped<AdminTypes.AdminRecommendation>('/admin/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing recommendation
   */
  async update(id: string, data: Omit<AdminTypes.CreateRecommendationRequest, 'id'>): Promise<AdminTypes.AdminRecommendation> {
    return fetchAdminWrapped<AdminTypes.AdminRecommendation>(`/admin/recommendations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a recommendation
   */
  async delete(id: string): Promise<{ message: string }> {
    return fetchAdminWrapped<{ message: string }>(`/admin/recommendations/${id}`, {
      method: 'DELETE',
    });
  }
};

const apiGet = <T>(endpoint: string): Promise<T> => fetchAdminWrapped<T>(endpoint);
const apiPost = <T>(endpoint: string, data: unknown): Promise<T> =>
  fetchAdminWrapped<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
const apiPut = <T>(endpoint: string, data: unknown): Promise<T> =>
  fetchAdminWrapped<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
const apiDelete = <T>(endpoint: string): Promise<T> =>
  fetchAdminWrapped<T>(endpoint, { method: 'DELETE' });

// Topic Level Labels
export const getTopicLevels = (topicId: string) =>
  apiGet<AdminTypes.TopicLevelsResponse>(`/admin/topics/${topicId}/levels`);

export const updateTopicLevels = (topicId: string, data: AdminTypes.UpdateTopicLevels) =>
  apiPut<AdminTypes.TopicLevelsResponse>(`/admin/topics/${topicId}/levels`, data);

// Topic Recommendations
export const getTopicRecommendations = (topicId: string) =>
  apiGet<AdminTypes.TopicRecommendation[]>(`/admin/topics/${topicId}/recommendations`);

export const createTopicRecommendation = (
  topicId: string,
  data: AdminTypes.CreateTopicRec
) =>
  apiPost<AdminTypes.TopicRecommendation>(`/admin/topics/${topicId}/recommendations`, data);

export const updateTopicRecommendation = (
  topicId: string,
  recId: string,
  data: Partial<AdminTypes.CreateTopicRec>
) =>
  apiPut<AdminTypes.TopicRecommendation>(`/admin/topics/${topicId}/recommendations/${recId}`, data);

export const deleteTopicRecommendation = (
  topicId: string,
  recId: string
) =>
  apiDelete<{ message: string }>(`/admin/topics/${topicId}/recommendations/${recId}`);

export const testTopicRecommendations = (
  topicId: string,
  scores: { score: number; target: number }
) =>
  apiPost<{ score: number; target: number; gap: number; matchedRecommendations: AdminTypes.TopicRecommendation[] }>(
    `/admin/topics/${topicId}/recommendations/test`,
    scores
  );

export const importValidate = (data: { json: string }) =>
  apiPost('/admin/assessments/import/validate', data);

export const importExecute = (data: {
  json: string;
  mode: 'create' | 'update';
}) =>
  apiPost('/admin/assessments/import/execute', data);

// ==========================================
// Export all admin APIs as a single object
// ==========================================

export const AdminAPI = {
  auth: AdminAuthAPI,
  dashboard: DashboardAPI,
  assessments: AssessmentAdminAPI,
  responses: ResponseAdminAPI,
  analytics: AnalyticsAPI,
  recommendations: RecommendationAdminAPI,
};

export default AdminAPI;
