/**
 * Core HTTP client for API communication
 * Features:
 * - Automatic error handling
 * - Request/response interceptors
 * - TypeScript type safety
 * - Retry logic for failed requests
 * - Cookie-based authentication support
 */

import { API_BASE_URL } from '@/config/api';
import { clearAdminAuthMarker } from '@/lib/auth/adminAuthMarker';
import { logger } from '@/lib/utils/logger';

const CSRF_ENDPOINT = '/csrf-token';
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfTokenCache: string | null = null;
const LOGIN_PATH = '/admin/login';

function shouldRedirectToLoginOn401(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return !window.location.pathname.startsWith(LOGIN_PATH);
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  retry?: boolean;
  retryAttempts?: number;
}

export class ApiClient {
  private static async getCsrfToken(): Promise<string> {
    if (csrfTokenCache) {
      return csrfTokenCache;
    }

    const response = await fetch(`${API_BASE_URL}${CSRF_ENDPOINT}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to initialize CSRF protection');
    }

    const data = (await response.json()) as { csrfToken?: string };
    if (!data.csrfToken) {
      throw new Error('CSRF token missing from response');
    }

    csrfTokenCache = data.csrfToken;
    return data.csrfToken;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { 
      method = 'GET', 
      headers = {}, 
      body, 
      retry = false, 
      retryAttempts = 3
    } = options;

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const resolvedMethod = method.toUpperCase();
    const resolvedHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers };

    if (CSRF_METHODS.has(resolvedMethod)) {
      resolvedHeaders['X-CSRF-Token'] = await this.getCsrfToken();
    }

    const config: RequestInit = {
      method: resolvedMethod,
      headers: resolvedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    };

    let attempts = 0;
    const maxAttempts = retry ? retryAttempts : 1;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(url, config);
        
        // Handle 204 No Content
        if (response.status === 204) {
          return { success: true };
        }

        const raw = await response.text();
        const data = raw ? (JSON.parse(raw) as ApiResponse<T>) : ({ success: true } as ApiResponse<T>);

        if (response.status === 401 && shouldRedirectToLoginOn401()) {
          clearAdminAuthMarker();
          window.location.href = '/admin/login';
          throw new Error('Authentication required');
        }

        if (response.status === 403) {
          csrfTokenCache = null;
        }

        if (!response.ok) {
          throw new Error(data.error || `API Error: ${response.statusText}`);
        }

        return data;

      } catch (error: unknown) {
        attempts++;
        logger.warn(`API request failed (attempt ${attempts}/${maxAttempts})`, {
          endpoint,
          method: resolvedMethod,
          error,
        });
        const message = error instanceof Error ? error.message : 'Network request failed';

        if (attempts >= maxAttempts) {
          throw new Error(message);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    throw new Error('Request failed after max retries');
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', retry: true });
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  static async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: data, retry: true });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
