/**
 * Centralized API client for all HTTP requests
 * Handles authentication, error handling, and request/response transformation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Token refresh lock to prevent concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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
 * Get user's access token from cookies
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = 'access_token=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

/**
 * Get user's refresh token from cookies
 */
function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = 'refresh_token=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

/**
 * Refresh access token using refresh token
 * Handles concurrent refresh requests with a lock
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.warn('No refresh token available');
        return null;
      }

      // Call refresh endpoint WITHOUT requiresAuth to avoid infinite loop
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        // Clear tokens on failed refresh
        clearAuthCookies();
        return null;
      }

      const data = (await response.json()) as { access_token: string; refresh_token: string };
      
      // Update cookies with new tokens
      setCookie('access_token', data.access_token, 7);
      setCookie('refresh_token', data.refresh_token, 7);

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthCookies();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Set cookie (client-side)
 */
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`;
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
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
    const backendMessage = (responseData as Record<string, unknown>).message as string;
    
    // Use backend message only if it's not a raw technical error
    if (backendMessage && !backendMessage.toLowerCase().includes('error') && backendMessage.length < 100) {
      return backendMessage;
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

    // Add authorization if required
    if (requiresAuth) {
      const token = getAccessToken();
      if (!token) {
        throw new ApiError(401, 'Authentication required. Please log in.');
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Build URL with query parameters
    const url = buildUrl(endpoint, params);

    // Make request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
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
        
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry request with new token
          console.log('Token refreshed, retrying request...');
          return request<T>(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new ApiError(401, 'Session expired. Please log in again.');
        }
      }

      const errorMessage = 
        (responseData as Record<string, unknown>)?.message ||
        getErrorMessage(response.status, undefined, responseData);
      
      throw new ApiError(response.status, errorMessage, responseData);
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

    // Add authorization if required
    if (requiresAuth) {
      const token = getAccessToken();
      if (!token) {
        throw new ApiError(401, 'Authentication required. Please log in.');
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Build URL with query parameters
    const url = buildUrl(endpoint, params);

    // Make request
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: formData,
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
        
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry request with new token
          console.log('Token refreshed, retrying request...');
          return apiUpload<T>(endpoint, formData, options);
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
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
