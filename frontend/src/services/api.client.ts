import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { JWT_TOKEN_KEY } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>): AxiosResponse => {
    // Unwrap data envelope so callers receive response.data directly
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      // 401 → clear auth and redirect to login
      if (status === 401) {
        localStorage.removeItem(JWT_TOKEN_KEY);
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }

      // Build normalised ApiError
      const apiError: ApiError = {
        success: false,
        statusCode: status ?? 0,
        code: (error.response?.data as { code?: string })?.code ?? 'UNKNOWN_ERROR',
        error:
          (error.response?.data as { error?: string })?.error ??
          error.message ??
          'An unexpected error occurred',
        details: (error.response?.data as { details?: Record<string, string[]> })?.details,
      };

      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
