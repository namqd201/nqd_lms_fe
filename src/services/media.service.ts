import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'xenpkjse';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'nqd_lms';

export interface UploadMediaResponse {
  url: string;
  filename: string;
  size: number;
  success: boolean;
}

export const mediaService = {
  /**
   * Upload image to Cloudinary (primary) or fallback to local backend.
   * Directly sends to Cloudinary CDN so Render server does not consume CPU/RAM/ephemeral disk.
   */
  uploadImage: async (file: File): Promise<UploadMediaResponse> => {
    // 1. Try Cloudinary direct unsigned upload if configured
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const res = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            url: data.secure_url || data.url,
            filename: data.original_filename || file.name,
            size: data.bytes || file.size,
            success: true,
          };
        } else {
          console.warn('Cloudinary upload response not ok, attempting fallback to backend:', res.status);
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload error, attempting fallback to backend:', cloudErr);
      }
    }

    // 2. Fallback to backend media controller
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return handleApiResponse<UploadMediaResponse>(response, 'Không thể tải lên hình ảnh');
  },

  /**
   * Resolves relative paths or keeps absolute URLs intact.
   */
  getFullUrl: (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  },
};