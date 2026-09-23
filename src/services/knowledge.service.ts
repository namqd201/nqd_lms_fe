import { KnowledgeCurriculum, KnowledgeLesson } from '@/types/knowledge';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const knowledgeService = {
  getCurriculum: async (subject: string, gradeLevel: string): Promise<KnowledgeCurriculum | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/public/knowledge/curriculums?subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(gradeLevel)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (response.status === 404) {
        return null;
      }
      return handleApiResponse<KnowledgeCurriculum>(response, 'Không thể tải khung kiến thức cơ bản');
    } catch {
      return null;
    }
  },

  getCurriculumByCode: async (code: string): Promise<KnowledgeCurriculum | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/knowledge/curriculums/${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 404) {
        return null;
      }
      return handleApiResponse<KnowledgeCurriculum>(response, 'Không thể tải thông tin khóa học chuẩn');
    } catch {
      return null;
    }
  },

  getLessonDetail: async (lessonId: string): Promise<KnowledgeLesson | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/knowledge/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return handleApiResponse<KnowledgeLesson>(response, 'Không thể tải chi tiết bài học');
    } catch {
      return null;
    }
  },
};
