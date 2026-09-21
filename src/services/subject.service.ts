import { SubjectResponse } from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const subjectService = {
  getActiveSubjects: async (): Promise<SubjectResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/teacher/subjects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
      // Fallback to public or admin endpoint if needed
      const adminRes = await fetch(`${API_BASE_URL}/api/v1/admin/subjects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (adminRes.ok) {
        return await adminRes.json();
      }
      return [];
    } catch {
      return [];
    }
  },
};
