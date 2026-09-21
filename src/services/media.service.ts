import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface UploadMediaResponse {
  url: string;
  filename: string;
  size: number;
  success: boolean;
}

export const mediaService = {
  uploadImage: async (file: File): Promise<UploadMediaResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return handleApiResponse<UploadMediaResponse>(response, 'Không thể tải lên hình ảnh');
  },

  getFullUrl: (relativeUrl: string): string => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
      return relativeUrl;
    }
    return `${API_BASE_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  },
};