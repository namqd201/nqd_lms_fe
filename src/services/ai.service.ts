import {
  TeacherAiGenerateQuestionsRequest,
  TeacherAiGenerateExamRequest,
  TeacherAiJobResponse,
  TeacherAiJobDetailResponse,
  TeacherAiGeneratedQuestionResponse,
  TeacherAiUpdateGeneratedQuestionRequest,
  TeacherAiApproveJobResponse,
} from '@/types/ai';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const aiService = {
  generateQuestions: async (data: TeacherAiGenerateQuestionsRequest): Promise<TeacherAiJobDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherAiJobDetailResponse>(response, 'Lỗi khi tạo câu hỏi bằng AI');
  },

  generateExam: async (data: TeacherAiGenerateExamRequest): Promise<TeacherAiJobDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/exams/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherAiJobDetailResponse>(response, 'Lỗi khi biên soạn đề thi bằng AI');
  },

  getMyJobs: async (): Promise<TeacherAiJobResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiJobResponse[]>(response, 'Lỗi tải danh sách tác vụ AI');
  },

  getJobDetail: async (jobId: string): Promise<TeacherAiJobDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiJobDetailResponse>(response, 'Lỗi tải chi tiết tác vụ AI');
  },

  updateGeneratedQuestion: async (
    jobId: string,
    questionId: string,
    data: TeacherAiUpdateGeneratedQuestionRequest
  ): Promise<TeacherAiGeneratedQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherAiGeneratedQuestionResponse>(response, 'Lỗi khi cập nhật câu hỏi AI');
  },

  approveSingleQuestion: async (
    jobId: string,
    questionId: string
  ): Promise<TeacherAiGeneratedQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}/questions/${questionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiGeneratedQuestionResponse>(response, 'Lỗi khi duyệt câu hỏi vào Ngân hàng câu hỏi');
  },

  rejectSingleQuestion: async (
    jobId: string,
    questionId: string
  ): Promise<TeacherAiGeneratedQuestionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}/questions/${questionId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiGeneratedQuestionResponse>(response, 'Lỗi khi từ chối câu hỏi');
  },

  approveAllValidQuestions: async (jobId: string): Promise<TeacherAiApproveJobResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}/approve-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiApproveJobResponse>(response, 'Lỗi khi phê duyệt hàng loạt câu hỏi');
  },

  createExamFromJob: async (jobId: string): Promise<TeacherAiApproveJobResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}/create-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherAiApproveJobResponse>(response, 'Lỗi khi tạo đề thi từ tác vụ AI');
  },

  deleteJob: async (jobId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/ai/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Lỗi khi xóa tác vụ AI');
  },
};
