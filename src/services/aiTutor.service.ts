import {
  StudentAiTutorRequest,
  StudentAiTutorResponse,
  AiTutorConversationDto,
  AiTutorConversationDetailDto,
  CreateAiTutorConversationRequest,
} from '@/types/aiTutor';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const aiTutorService = {
  getConversations: async (): Promise<AiTutorConversationDto[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/conversations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<AiTutorConversationDto[]>(response, 'Lỗi khi tải danh sách cuộc trò chuyện');
  },

  getConversationDetail: async (id: string): Promise<AiTutorConversationDetailDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/conversations/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<AiTutorConversationDetailDto>(response, 'Lỗi khi tải nội dung cuộc trò chuyện');
  },

  createConversation: async (
    data: CreateAiTutorConversationRequest
  ): Promise<AiTutorConversationDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<AiTutorConversationDto>(response, 'Lỗi khi tạo cuộc trò chuyện mới');
  },

  renameConversation: async (id: string, title: string): Promise<AiTutorConversationDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/conversations/${id}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title }),
    });

    return handleApiResponse<AiTutorConversationDto>(response, 'Lỗi khi đổi tên cuộc trò chuyện');
  },

  deleteConversation: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Lỗi khi xóa cuộc trò chuyện');
  },

  askAiTutor: async (
    data: StudentAiTutorRequest,
    abortSignal?: AbortSignal
  ): Promise<StudentAiTutorResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/ai-tutor/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
      signal: abortSignal,
    });

    return handleApiResponse<StudentAiTutorResponse>(response, 'Không thể kết nối với AI Tutor');
  },

  explainLesson: async (lessonId: string, customQuestion?: string): Promise<StudentAiTutorResponse> => {
    const url = new URL(`${API_BASE_URL}/api/v1/student/ai-tutor/explain-lesson/${lessonId}`);
    if (customQuestion) {
      url.searchParams.append('customQuestion', customQuestion);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAiTutorResponse>(response, 'Lỗi khi yêu cầu AI giải thích bài học');
  },

  explainWrongAnswer: async (examAttemptId: string, questionId: string): Promise<StudentAiTutorResponse> => {
    const url = new URL(`${API_BASE_URL}/api/v1/student/ai-tutor/explain-answer`);
    url.searchParams.append('examAttemptId', examAttemptId);
    url.searchParams.append('questionId', questionId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAiTutorResponse>(response, 'Lỗi khi yêu cầu AI giải thích câu sai');
  },

  provideHint: async (examAttemptId: string, questionId: string): Promise<StudentAiTutorResponse> => {
    const url = new URL(`${API_BASE_URL}/api/v1/student/ai-tutor/hint`);
    url.searchParams.append('examAttemptId', examAttemptId);
    url.searchParams.append('questionId', questionId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAiTutorResponse>(response, 'Lỗi khi yêu cầu AI gợi ý');
  },

  getRecommendations: async (courseId?: string): Promise<StudentAiTutorResponse> => {
    const url = new URL(`${API_BASE_URL}/api/v1/student/ai-tutor/recommendations`);
    if (courseId) {
      url.searchParams.append('courseId', courseId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAiTutorResponse>(response, 'Lỗi khi tải gợi ý lộ trình học');
  },
};
