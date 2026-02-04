/* API Configuration and Base Fetch Wrapper */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

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
    credentials: 'include',
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
    
    /* Handle validation errors (e.g. { errors: { email: "..." } }) */
    if (errorData?.errors && typeof errorData.errors === 'object') {
      const firstError = Object.values(errorData.errors)[0] || 'Validation failed';
      throw new ApiError(firstError, response.status, errorData.errors);
    }
    
    /* Handle explicit error/message from backend */
    const explicitMessage = errorData?.error || errorData?.message;
    if (explicitMessage && typeof explicitMessage === 'string') {
      throw new ApiError(explicitMessage, response.status);
    }
    
    /* 400 with empty or unknown body: common when e.g. email already exists */
    if (response.status === 400) {
      throw new ApiError(
        'Bad request. Check your input (e.g. this email may already be in use, or a field is invalid).',
        response.status
      );
    }
    
    /* Fallback for other status codes */
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

export { API_BASE_URL };
