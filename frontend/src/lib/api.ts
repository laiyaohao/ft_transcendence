// frontend/lib/api.ts
import { saveAuthSession, type AuthResponsePayload } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  const isAuthRoute = endpoint.startsWith('/api/auth/');

  return fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(!isAuthRoute && token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
}

export async function getErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();

  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(body) as unknown;
      if (typeof data === 'object' && data !== null) {
        if (typeof (data as { message?: string }).message === 'string') {
          return (data as { message: string }).message;
        }
        if (typeof (data as { error?: string }).error === 'string') {
          return (data as { error: string }).error;
        }
      }
    } catch {
      // Fall back to the plain-text response below.
    }
  }

  return body || `Request failed with status ${response.status}`;
}

// Usage:
export async function register(email: string, password: string, fullName: string) {
  const response = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, role: 'STUDENT' }),
  });
  const jsonResponse = await response.json() as AuthResponsePayload;
  saveAuthSession(jsonResponse);
  return jsonResponse;
}
