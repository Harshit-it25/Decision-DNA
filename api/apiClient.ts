
/**
 * API Client Utility
 * Handles common fetch logic, including API key headers and error handling.
 */

const API_KEY = (import.meta as any).env?.VITE_API_KEY || 'decision_dna_secret_key_2024';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('x-api-key', API_KEY);
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}
