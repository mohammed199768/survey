/**
 * API Endpoint Functions
 * All backend API calls organized by feature
 * All responses are wrapped in { success: boolean, data: ... } format
 */

import * as Types from './types';
import {
  AnswerResponseDataSchema,
  AssessmentResponseSchema,
  AssessmentStructureResponseSchema,
  CompleteResponseDataSchema,
  NarrativeDefinitionAPISchema,
  ParticipantResponseDataSchema,
  RecommendationsDataSchema,
  RecommendationsDefinitionAPISchema,
  ResultsDataSchema,
  SessionDataInnerSchema,
  StartResponseDataSchema,
} from './schemas';
import { z } from 'zod';
import { API_BASE_URL } from '@/config/api';

const API_BASE = API_BASE_URL;

const getResponseSessionHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const sessionToken = window.localStorage.getItem('sessionToken');
  if (!sessionToken) {
    return {};
  }

  return { 'x-session-token': sessionToken };
};

/**
 * Generic fetch wrapper for endpoints that return wrapped responses
 */
async function fetchWrapped<T>(endpoint: string, schema: z.ZodType<T>, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as unknown;
  
  const envelopeSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
  });
  const parsedEnvelope = envelopeSchema.parse(result);

  if (parsedEnvelope.success === false) {
    throw new Error(parsedEnvelope.error || 'API returned error');
  }
  if (typeof parsedEnvelope.data === 'undefined') {
    throw new Error('API returned success without data');
  }

  return schema.parse(parsedEnvelope.data);
}

/**
 * Generic fetch for endpoints that return unwrapped responses
 */
async function fetchRaw<T>(endpoint: string, schema: z.ZodType<T>, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as unknown;
  return schema.parse(result);
}

export const AssessmentAPI = {
  /**
   * Get the currently active published assessment
   */
  async getActive(): Promise<Types.AssessmentResponse> {
    return fetchWrapped('/public/assessments/active', AssessmentResponseSchema);
  },

  /**
   * Get complete assessment structure (dimensions + topics)
   * Note: The /active/structure endpoint returns unwrapped response
   */
  async getStructure(assessmentId: string): Promise<Types.AssessmentStructureResponse> {
    // Use the wrapped endpoint
    return fetchWrapped(`/public/assessments/${assessmentId}/structure`, AssessmentStructureResponseSchema);
  },

  /**
   * Alternative: Get active assessment structure directly
   * Returns unwrapped response from /public/assessments/active/structure
   */
  async getActiveStructure(): Promise<Types.AssessmentStructureResponse> {
    return fetchRaw('/public/assessments/active/structure', AssessmentStructureResponseSchema);
  },

  /**
   * Get recommendations definition from database
   * Returns unwrapped response
   */
  async getRecommendationsDefinition(): Promise<Types.RecommendationsDefinitionAPI> {
    return fetchRaw('/public/recommendations/definition', RecommendationsDefinitionAPISchema);
  },

  /**
   * Get narrative definition from database
   * Returns unwrapped response
   */
  async getNarrativeDefinition(): Promise<Types.NarrativeDefinitionAPI> {
    return fetchRaw('/public/narrative/definition', NarrativeDefinitionAPISchema);
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
    const response = await fetchWrapped(
      '/public/participants',
      ParticipantResponseDataSchema,
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
    return fetchWrapped(
      '/public/responses/start',
      StartResponseDataSchema,
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
    return fetchWrapped(
      `/public/responses/${responseId}/answer`,
      AnswerResponseDataSchema,
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
    return fetchWrapped(
      `/public/responses/session/${sessionToken}`,
      SessionDataInnerSchema
    );
  },

  /**
   * Complete the assessment
   */
  async complete(responseId: string): Promise<Types.CompleteResponseData> {
    return fetchWrapped(
      `/public/responses/${responseId}/complete`,
      CompleteResponseDataSchema,
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
    return fetchWrapped(
      `/public/responses/${responseId}/results`,
      ResultsDataSchema,
      {
        headers: getResponseSessionHeaders(),
      }
    );
  },

  /**
   * Get recommendations (optional endpoint)
   */
  async getRecommendations(responseId: string): Promise<Types.RecommendationsData> {
    return fetchWrapped(
      `/public/responses/${responseId}/recommendations`,
      RecommendationsDataSchema,
      {
        headers: getResponseSessionHeaders(),
      }
    );
  },
};
