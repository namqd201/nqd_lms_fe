import {
  QuestionCategoryRequest,
  QuestionCategoryResponse,
} from '@/types/question';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const questionCategoryService = {
  getCategories: async (params?: {
    subjectId?: string;
    gradeLevel?: string;
  }): Promise<QuestionCategoryResponse[]> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.subjectId) query.append('subjectId', params.subjectId);
      if (params.gradeLevel) query.append('gradeLevel', params.gradeLevel);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/question-categories${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<QuestionCategoryResponse[]>(response, 'Không thể tải danh sách chuyên đề / danh mục câu hỏi');
  },

  getCategoryById: async (id: string): Promise<QuestionCategoryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/question-categories/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<QuestionCategoryResponse>(response, 'Không thể tải thông tin chuyên đề');
  },

  createCategory: async (data: QuestionCategoryRequest): Promise<QuestionCategoryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/question-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<QuestionCategoryResponse>(response, 'Tạo chuyên đề mới thất bại');
  },

  updateCategory: async (
    id: string,
    data: QuestionCategoryRequest
  ): Promise<QuestionCategoryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/question-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<QuestionCategoryResponse>(response, 'Cập nhật chuyên đề thất bại');
  },

  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/question-categories/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    await handleApiResponse<void>(response, 'Xóa chuyên đề thất bại');
  },
};
