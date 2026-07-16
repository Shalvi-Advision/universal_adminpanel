// API Client utility for making HTTP requests

import { getSelectedProjectCode } from 'src/utils/project-code';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008';

// Get auth token from session storage
const getAuthToken = (): string | null => sessionStorage.getItem('authToken');

// Clear auth data on logout or token expiry
export const clearAuthData = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
};

// Handle API errors
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Bind the request to the selected client/tenant. Auth endpoints are
  // exempt so admin login always resolves to the backend's default project,
  // regardless of which client is selected in the UI.
  if (!endpoint.startsWith('/api/auth')) {
    headers['X-Project-Code'] = getSelectedProjectCode();
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Parse response
    const data = await response.json();

    // Handle 401 Unauthorized - auto logout
    if (response.status === 401) {
      clearAuthData();
      // Redirect to sign-in page
      window.location.href = '/sign-in';
      throw new ApiError(401, 'Unauthorized - Please sign in again');
    }

    // Check response body's success field first (for backends that return wrong status codes)
    // If success field exists and is false, treat as error
    if (data.success === false) {
      throw new ApiError(
        response.status,
        data.message || 'An error occurred',
        data
      );
    }

    // If success field is true or doesn't exist, check HTTP status
    // Only throw error if both conditions fail
    if (!response.ok && data.success !== true) {
      throw new ApiError(
        response.status,
        data.message || 'An error occurred',
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors
    throw new ApiError(0, 'Network error - Please check your connection');
  }
}

// API client methods
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };
