import { MessageResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const authService = {
  getApiUrl: (): string => {
    return API_BASE_URL;
  },

  getGoogleLoginUrl: (): string => {
    return `${API_BASE_URL}/oauth2/authorization/google`;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_session_id');
        if (token) {
          headers['X-Session-Id'] = token;
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include', // Bắt buộc để gửi kèm JSESSIONID cookie
      });

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_session_id');
        }
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: User = await response.json();
      return data;
    } catch (error) {
      console.warn('Cannot fetch current user:', error);
      return null;
    }
  },

  logout: async (): Promise<MessageResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_session_id');
      if (token) {
        headers['X-Session-Id'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_session_id');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include', // Bắt buộc để xóa session trên backend
    });

    if (!response.ok) {
      throw new Error(`Logout failed with status ${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      return { message: 'Logged out successfully', success: true };
    }
  },

  completeOnboarding: async (): Promise<MessageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to complete onboarding: HTTP ${response.status}`);
    }

    return await response.json();
  },

  checkBackendConnection: async (): Promise<boolean> => {
    try {
      // Test fetching /api/v1/auth/me (expected 401 if unauthenticated, which means BE is alive)
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      // Any response from BE (200, 401, 403) indicates the server is running and accessible
      return res.status === 200 || res.status === 401 || res.status === 403;
    } catch {
      return false;
    }
  },
};
