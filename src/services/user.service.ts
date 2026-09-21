import { UpdateProfileRequest, UserProfileResponse } from '@/types/user';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const userService = {
  getMyProfile: async (): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse>(response, 'Không thể tải thông tin hồ sơ cá nhân');
  },

  updateMyProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<UserProfileResponse>(response, 'Cập nhật thông tin hồ sơ thất bại');
  },

  getUserById: async (id: string): Promise<UserProfileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<UserProfileResponse>(response, 'Không thể tải thông tin người dùng');
  },
};
