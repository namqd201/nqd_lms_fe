import { UpdateProfileRequest, UserProfileResponse } from '@/types/user';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const studentService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse>(response, 'Không thể tải thông tin hồ sơ học viên');
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<UserProfileResponse>(response, 'Cập nhật hồ sơ học viên thất bại');
  },
};
