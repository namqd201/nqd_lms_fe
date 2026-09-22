/**
 * Central API Interceptor and Auth Token Manager for NQD-LMS
 * Ensures that all outgoing requests to the backend API automatically carry the 7-day JWT token
 * in the Authorization: Bearer <token> header and X-Session-Id header.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token') || localStorage.getItem('auth_session_id');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_session_id', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_session_id');
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Session-Id'] = token;
  }
  return headers;
}

/**
 * Installs a transparent fetch interceptor on client-side window.fetch
 * so that any service making requests to the backend API automatically
 * includes the Authorization Bearer header.
 */
export function initApiInterceptor(): void {
  if (typeof window === 'undefined') return;

  const win = window as any;
  if (win.__nqd_fetch_interceptor_installed__) {
    return;
  }
  win.__nqd_fetch_interceptor_installed__ = true;

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getAuthToken();

    let urlString = '';
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      urlString = (input as Request).url;
    }

    const isBackendApi =
      urlString.startsWith(API_BASE_URL) ||
      urlString.startsWith('/api/') ||
      urlString.includes('/api/v1/');

    if (token && isBackendApi) {
      const clonedInit: RequestInit = { ...(init || {}) };
      const headers = new Headers(clonedInit.headers || (input instanceof Request ? input.headers : {}));

      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('X-Session-Id')) {
        headers.set('X-Session-Id', token);
      }

      if (!clonedInit.credentials) {
        clonedInit.credentials = 'include';
      }
      clonedInit.headers = headers;

      return originalFetch.call(this, input, clonedInit);
    }

    return originalFetch.call(this, input, init);
  };
}

// Auto-run interceptor initialization when imported
if (typeof window !== 'undefined') {
  initApiInterceptor();
}
