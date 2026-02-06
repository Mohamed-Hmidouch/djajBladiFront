/* API Configuration and Base Fetch Wrapper */

/**
 * API requests go through Next.js rewrites proxy.
 * This eliminates CORS issues and hides the backend URL from the client.
 * The proxy is configured in next.config.ts
 */
const API_BASE_URL = '';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  /* Handle empty responses */
  const contentType = response.headers.get('content-type');
  let data: unknown = null;
  
  if (contentType?.includes('application/json')) {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  }

  if (!response.ok) {
    const errorData = data as { errors?: Record<string, string>; error?: string; message?: string } | null;
    
    /* Handle validation errors */
    if (errorData?.errors) {
      const firstError = Object.values(errorData.errors)[0] || 'Validation failed';
      throw new ApiError(firstError, response.status, errorData.errors);
    }
    
    /* Handle general errors */
    const message = errorData?.error || errorData?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export { API_BASE_URL };
