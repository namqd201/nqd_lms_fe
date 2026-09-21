import {
  TeacherQuestionRequest,
  TeacherQuestionResponse,
  QuestionFilterParams,
  QuestionStatus,
  QuestionPaperExportRequest,
} from '@/types/question';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const questionService = {
  getQuestions: async (params?: QuestionFilterParams): Promise<TeacherQuestionResponse[]> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.subjectId) query.append('subjectId', params.subjectId);
      if (params.categoryId) query.append('categoryId', params.categoryId);
      if (params.courseId) query.append('courseId', params.courseId);
      if (params.lessonId) query.append('lessonId', params.lessonId);
      if (params.gradeLevel) query.append('gradeLevel', params.gradeLevel);
      if (params.questionType) query.append('questionType', params.questionType);
      if (params.difficulty) query.append('difficulty', params.difficulty);
      if (params.status) query.append('status', params.status);
      if (params.tag) query.append('tag', params.tag);
      if (params.keyword) query.append('keyword', params.keyword);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherQuestionResponse[]>(response, 'Không thể tải danh sách câu hỏi');
  },

  getQuestionById: async (id: string): Promise<TeacherQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherQuestionResponse>(response, 'Không thể tải thông tin câu hỏi');
  },

  createQuestion: async (data: TeacherQuestionRequest): Promise<TeacherQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherQuestionResponse>(response, 'Tạo câu hỏi mới thất bại');
  },

  updateQuestion: async (
    id: string,
    data: TeacherQuestionRequest
  ): Promise<TeacherQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherQuestionResponse>(response, 'Cập nhật câu hỏi thất bại');
  },

  archiveQuestion: async (id: string): Promise<TeacherQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/${id}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherQuestionResponse>(response, 'Lưu trữ câu hỏi thất bại');
  },

  updateQuestionStatus: async (
    id: string,
    status: QuestionStatus
  ): Promise<TeacherQuestionResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/teacher/questions/${id}/status?status=${status}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );

    return handleApiResponse<TeacherQuestionResponse>(response, 'Cập nhật trạng thái câu hỏi thất bại');
  },

  deleteQuestion: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Xóa câu hỏi thất bại');
  },

  getDeletedQuestions: async (): Promise<TeacherQuestionResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/trash`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherQuestionResponse[]>(response, 'Không thể tải lịch sử câu hỏi đã xóa');
  },

  restoreQuestion: async (id: string): Promise<TeacherQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/${id}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherQuestionResponse>(response, 'Khôi phục câu hỏi thất bại');
  },

  /**
   * Export Question Bank to Word (.docx) without answer key
   */
  exportQuestionsDocx: async (
    payload: QuestionPaperExportRequest,
    customFilename?: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tải đề câu hỏi định dạng Word. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `De_On_Tap_${new Date().toISOString().slice(0, 10)}.docx`;
    triggerBlobDownload(blob, filename);
  },

  /**
   * Export Question Bank to PDF (.pdf) without answer key
   */
  exportQuestionsPdf: async (
    payload: QuestionPaperExportRequest,
    customFilename?: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/questions/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tải đề câu hỏi định dạng PDF. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `De_On_Tap_${new Date().toISOString().slice(0, 10)}.pdf`;
    triggerBlobDownload(blob, filename);
  },
};

function triggerBlobDownload(blob: Blob, defaultFilename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

