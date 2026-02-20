/**
 * API Endpoint Functions
 * All backend API calls organized by feature
 * All responses are wrapped in { success: boolean, data: ... } format
 */

import * as Types from './types';
import { API_BASE_URL } from '@/config/api';
import { useReadinessStore } from '@/store/readiness/readiness.store';

const API_BASE = API_BASE_URL;
const JSON_BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
// Complexity rationale: keep runtime validation on server-side modules, reducing client parse cost with smaller O(b) bundles.

const buildRequestHeaders = (method: string, options?: RequestInit): Headers => {
  const headers = new Headers(options?.headers);
  const hasBody = options?.body !== undefined && options?.body !== null;

  // Complexity rationale: avoid forcing preflight (OPTIONS + GET = O(2n)); body-less requests stay simple (O(n)).
  if (JSON_BODY_METHODS.has(method) && hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getResponseSessionHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const sessionToken = useReadinessStore.getState().sessionToken;
  if (!sessionToken) {
    return {};
  }

  return { 'x-session-token': sessionToken };
};

/**
 * Generic fetch wrapper for endpoints that return wrapped responses
 */
async function fetchWrapped<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method,
    headers: buildRequestHeaders(method, options),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as unknown;

  if (!isObjectLike(result) || typeof result.success !== 'boolean') {
    throw new Error('Invalid API envelope');
  }

  if (result.success === false) {
    const errorMessage = typeof result.error === 'string' ? result.error : 'API returned error';
    throw new Error(errorMessage);
  }

  if (typeof result.data === 'undefined') {
    throw new Error('API returned success without data');
  }

  return result.data as T;
}

/**
 * Generic fetch for endpoints that return unwrapped responses
 */
async function fetchRaw<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method,
    headers: buildRequestHeaders(method, options),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as unknown;
  return result as T;
}

export const AssessmentAPI = {
  /**
   * Get the currently active published assessment
   */
  async getActive(): Promise<Types.AssessmentResponse> {
    return fetchWrapped<Types.AssessmentResponse>('/public/assessments/active');
  },

  /**
   * Get complete assessment structure (dimensions + topics)
   * Note: The /active/structure endpoint returns unwrapped response
   */
  async getStructure(assessmentId: string): Promise<Types.AssessmentStructureResponse> {
    // Use the wrapped endpoint
    return fetchWrapped<Types.AssessmentStructureResponse>(`/public/assessments/${assessmentId}/structure`);
  },

  /**
   * Alternative: Get active assessment structure directly
   * Returns unwrapped response from /public/assessments/active/structure
   */
  async getActiveStructure(): Promise<Types.AssessmentStructureResponse> {
    return fetchRaw<Types.AssessmentStructureResponse>('/public/assessments/active/structure');
  },

  /**
   * Get recommendations definition from database
   * Returns unwrapped response
   */
  async getRecommendationsDefinition(): Promise<Types.RecommendationsDefinitionAPI> {
    return fetchRaw<Types.RecommendationsDefinitionAPI>('/public/recommendations/definition');
  },

  /**
   * Get narrative definition from database
   * Returns unwrapped response
   */
  async getNarrativeDefinition(): Promise<Types.NarrativeDefinitionAPI> {
    return fetchRaw<Types.NarrativeDefinitionAPI>('/public/narrative/definition');
  }
};

export const ParticipantAPI = {
  /**
   * Register a new participant or update existing
   */
  async register(
    data: Types.RegistrationData,
    participantToken?: string | null
  ): Promise<Types.ParticipantResponseData> {
    const response = await fetchWrapped<Types.ParticipantResponseData>(
      '/public/participants',
      {
        method: 'POST',
        headers: participantToken ? { 'x-participant-token': participantToken } : undefined,
        body: JSON.stringify(data),
      }
    );
    return response;
  },
};

export const ResponseAPI = {
  /**
   * Start a new assessment response
   */
  async start(assessmentId: string, participantId: string): Promise<Types.StartResponseData> {
    return fetchWrapped<Types.StartResponseData>(
      '/public/responses/start',
      {
        method: 'POST',
        body: JSON.stringify({ assessmentId, participantId }),
      }
    );
  },

  /**
   * Submit an answer for a topic
   */
  async submitAnswer(responseId: string, answer: {
    topicId: string;
    currentRating: number;
    targetRating: number;
    timeSpentSeconds?: number;
    notes?: string;
  }): Promise<Types.AnswerResponseData> {
    return fetchWrapped<Types.AnswerResponseData>(
      `/public/responses/${responseId}/answer`,
      {
        method: 'PUT',
        headers: getResponseSessionHeaders(),
        body: JSON.stringify(answer),
      }
    );
  },

  /**
   * Get session data by token (for resuming)
   */
  async getSession(sessionToken: string): Promise<Types.SessionDataInner> {
    return fetchWrapped<Types.SessionDataInner>(`/public/responses/session/${sessionToken}`);
  },

  /**
   * Complete the assessment
   */
  async complete(responseId: string): Promise<Types.CompleteResponseData> {
    return fetchWrapped<Types.CompleteResponseData>(
      `/public/responses/${responseId}/complete`,
      {
        method: 'POST',
        headers: getResponseSessionHeaders(),
      }
    );
  },

  /**
   * Get assessment results
   */
  async getResults(responseId: string): Promise<Types.ResultsData> {
    return fetchWrapped<Types.ResultsData>(
      `/public/responses/${responseId}/results`,
      {
        headers: getResponseSessionHeaders(),
      }
    );
  },

  /**
   * Get recommendations (optional endpoint)
   */
  async getRecommendations(responseId: string): Promise<Types.RecommendationsData> {
    return fetchWrapped<Types.RecommendationsData>(
      `/public/responses/${responseId}/recommendations`,
      {
        headers: getResponseSessionHeaders(),
      }
    );
  },
};
