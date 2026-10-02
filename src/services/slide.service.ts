import {
  GenerateSlideRequest,
  LessonSlideResponse,
  SlideTargetType,
} from '@/types/slide';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const slideService = {
  getSlide: async (targetType: SlideTargetType, targetId: string): Promise<LessonSlideResponse> => {
    const params = new URLSearchParams({ targetType, targetId });
    const response = await fetch(`${API_BASE_URL}/api/v1/slides?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleApiResponse<LessonSlideResponse>(response, 'Không thể tải thông tin slide bài học');
  },

  generateSlideWithAi: async (data: GenerateSlideRequest): Promise<LessonSlideResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/slides/ai-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<LessonSlideResponse>(response, 'Không thể tạo slide tự động bằng AI');
  },

  uploadSlideFile: async (
    targetType: SlideTargetType,
    targetId: string,
    file: File
  ): Promise<LessonSlideResponse> => {
    const formData = new FormData();
    formData.append('targetType', targetType);
    formData.append('targetId', targetId);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/slides/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleApiResponse<LessonSlideResponse>(response, 'Không thể tải lên file slide');
  },

  deleteSlide: async (slideId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/slides/${slideId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa slide bài học');
  },

  getDownloadUrl: (targetType: SlideTargetType, targetId: string): string => {
    return `${API_BASE_URL}/api/v1/slides/download?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`;
  },

  getFileUrl: (relativeUrl: string): string => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    return `${API_BASE_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  },
};
