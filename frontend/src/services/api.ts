import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// =============================================================================
// API Configuration
// =============================================================================

// Use relative URL for API calls - Next.js rewrites will proxy to the backend
// This works both locally and on Railway because the requests go through the Next.js server
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// =============================================================================
// Retry Configuration
// =============================================================================

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ERR_NETWORK'],
};

// Extend axios config to track retry state
interface ExtendedAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function getRetryDelay(retryCount: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
}

/**
 * Check if the error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors
  if (!error.response && error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }

  // HTTP status codes
  if (error.response && RETRY_CONFIG.retryableStatuses.includes(error.response.status)) {
    return true;
  }

  return false;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// Request Interceptor
// =============================================================================

api.interceptors.request.use(
  (config: ExtendedAxiosConfig) => {
    // Initialize retry count
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }

    // Add auth token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// Response Interceptor with Retry Logic
// =============================================================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosConfig | undefined;

    if (!config) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          config.headers.Authorization = `Bearer ${accessToken}`;
          return api(config);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle retryable errors with exponential backoff
    const retryCount = config._retryCount || 0;

    if (isRetryableError(error) && retryCount < RETRY_CONFIG.maxRetries) {
      config._retryCount = retryCount + 1;
      const delay = getRetryDelay(retryCount);

      console.warn(
        `[API] Request failed, retrying (${config._retryCount}/${RETRY_CONFIG.maxRetries}) after ${Math.round(delay)}ms:`,
        error.code || error.response?.status
      );

      await sleep(delay);
      return api(config);
    }

    // If we've exhausted retries, reject with enhanced error
    return Promise.reject(error);
  }
);

// =============================================================================
// Error Types
// =============================================================================

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  field?: string;
  details?: Record<string, unknown>;
  isRetryable: boolean;
}

/**
 * Parse axios error into a standardized ApiError
 */
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: Array<{ field: string; message: string }> }>;

    // Network error
    if (!axiosError.response) {
      return {
        code: axiosError.code || 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
        isRetryable: true,
      };
    }

    // HTTP error with response
    const status = axiosError.response.status;
    const responseData = axiosError.response.data;

    // Extract message from various response formats
    let message = 'An unexpected error occurred';
    if (responseData?.message) {
      message = responseData.message;
    } else if (responseData?.error) {
      message = responseData.error;
    } else if (responseData?.errors && responseData.errors.length > 0) {
      message = responseData.errors.map(e => e.message).join(', ');
    }

    // Map status codes to user-friendly messages
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Your session has expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This operation conflicts with existing data.',
      422: 'The data provided is invalid.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again later.',
      502: 'Server is temporarily unavailable. Please try again.',
      503: 'Service is temporarily unavailable. Please try again.',
      504: 'Request timed out. Please try again.',
    };

    return {
      code: `HTTP_${status}`,
      message: message !== 'An unexpected error occurred' ? message : statusMessages[status] || message,
      status,
      isRetryable: RETRY_CONFIG.retryableStatuses.includes(status),
      details: responseData as Record<string, unknown>,
    };
  }

  // Non-axios error
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      isRetryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    isRetryable: false,
  };
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'isRetryable' in error
  );
}

export default api;
