/**
 * Centralized API client for all HTTP requests
 * Handles authentication, error handling, and request/response transformation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Token refresh lock to prevent concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Refresh access token using refresh token (via HttpOnly cookie)
 * Handles concurrent refresh requests with a lock
 */
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Call refresh endpoint WITHOUT requiresAuth to avoid infinite loop
      // Credentials included automatically
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
}

/**
 * Get error message based on HTTP status code
 */
function getErrorMessage(status: number, customMessage?: string, responseData?: unknown): string {
  if (customMessage) return customMessage;
  
  // For 404 errors, always use the standard message
  if (status === 404) {
    return 'The requested resource was not found. Please check your connection and try again.';
  }
  
  // Check if response contains a message from backend
  if (responseData && typeof responseData === 'object' && 'message' in responseData) {
    const backendMessage = (responseData as Record<string, unknown>).message;
    
    if (Array.isArray(backendMessage)) {
      return backendMessage.join('\n');
    }

  }
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 409:
      return 'Email or username already exists. Please try a different one.';
    case 422:
      return 'Unable to process your request. Please check your input.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Handle network and fetch errors
 */
function handleNetworkError(error: unknown): never {
  if (error instanceof TypeError) {
    const message = error.message;
    
    // Check for various network error patterns
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      throw new ApiError(
        0,
        'Unable to connect to the server. Please check your internet connection.'
      );
    }
    
    // Check for "Cannot POST" or similar method errors (404 from network)
    if (message.includes('Cannot') || message.includes('POST') || message.includes('GET')) {
      throw new ApiError(
        0,
        'The server is not responding. Please make sure it is running and try again.'
      );
    }
  }
  
  if (error instanceof Error) {
    // Don't expose raw error messages - provide user-friendly alternatives
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('cors')) {
      throw new ApiError(
        0,
        'Unable to communicate with the server. Please try again later.'
      );
    }
    
    throw new ApiError(
      0,
      'Something went wrong. Please try again or contact support if the problem persists.'
    );
  }
  
  throw new ApiError(0, 'An unexpected error occurred. Please try again.');
}

/**
 * Core API request function
 * Handles authentication, error handling, and response parsing
 * Automatically retries on 401 with token refresh
 */
async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount = 0
): Promise<T> {
  const {
    requiresAuth = false,
    params,
    method = 'GET',
    headers = {},
    body,
    ...restOptions
  } = options;

  try {
    // Build headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Build URL with query parameters
    const url = buildUrl(endpoint, params);

    // Make request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Always include cookies
      ...restOptions,
    });

    // Parse response
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    // Handle error responses
    if (!response.ok) {
      // 401 Unauthorized - try to refresh token and retry once
      if (response.status === 401 && retryCount === 0 && requiresAuth) {
        console.log('Token expired, attempting to refresh...');
        
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry request with new token (cookies updated automatically)
          console.log('Token refreshed, retrying request...');
          return request<T>(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isPublicRoute = 
              currentPath.startsWith("/login") || 
              currentPath.startsWith("/register") || 
              currentPath.startsWith("/forgot-password") || 
              currentPath.startsWith("/reset-password") ||
              currentPath.startsWith("/verify-email") ||
              currentPath.startsWith("/auth");
              
            if (!isPublicRoute) {
              window.location.href = '/login';
            }
          }
          throw new ApiError(401, 'Session expired. Please log in again.');
        }
      }

      const rawMessage = (responseData as Record<string, unknown>)?.message;
      const errorMessage = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || getErrorMessage(response.status, undefined, responseData);
      
      throw new ApiError(response.status, String(errorMessage), responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    handleNetworkError(error);
  }
}

/**
 * GET request
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * PATCH request
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * DELETE request
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Upload file with multipart/form-data
 */
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestOptions, 'body'> = {}
): Promise<T> {
  const {
    requiresAuth = false,
    params,
    method = 'POST',
    headers = {},
    ...restOptions
  } = options;

  try {
    // Build headers (do NOT set Content-Type for FormData - browser will set it with boundary)
    const requestHeaders: Record<string, string> = {};
    
    // Add custom headers if provided
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      });
    }

    // Build URL with query parameters
    const url = buildUrl(endpoint, params);

    // Make request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: formData,
      credentials: 'include', // Always include cookies
      ...restOptions,
    });

    // Parse response
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    // Handle error responses
    if (!response.ok) {
      // 401 Unauthorized - try to refresh token and retry once
      if (response.status === 401 && requiresAuth) {
        console.log('Token expired, attempting to refresh...');
        
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry request with new token
          console.log('Token refreshed, retrying request...');
          return apiUpload<T>(endpoint, formData, options);
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
              window.location.href = '/login';
            }
          }
          throw new ApiError(401, 'Session expired. Please log in again.');
        }
      }

      const errorMessage = 
        (responseData as Record<string, unknown>)?.message ||
        getErrorMessage(response.status, undefined, responseData);
      
      throw new ApiError(response.status, String(errorMessage), responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    handleNetworkError(error);
  }
}

/**
 * Export base request function for advanced use cases
 */
export { request as apiRequest };

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  upload: apiUpload,
  request,
};
