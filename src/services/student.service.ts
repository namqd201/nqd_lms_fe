import { UpdateProfileRequest, UserProfileResponse } from '@/types/user';
import { StudentResumeLearningResponse, WeeklyScheduleEventDto } from '@/types/student';
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

  sendParentReportNow: async (): Promise<{ message: string; parentEmail: string; sentAt: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/profile/send-parent-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<{ message: string; parentEmail: string; sentAt: string }>(
      response,
      'Gửi báo cáo học tập cho phụ huynh thất bại'
    );
  },

  getResumeLearning: async (): Promise<StudentResumeLearningResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/progress/resume`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<StudentResumeLearningResponse>(
      response,
      'Không thể tải tiến trình học tập tiếp tục'
    );
  },

  getWeeklySchedule: async (): Promise<WeeklyScheduleEventDto[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/student/progress/weekly-schedule`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const json = await response.json();
        return json.data || [];
      }
    } catch {
      // fallback to public weekly schedule
    }

    try {
      const publicRes = await fetch(`${API_BASE_URL}/api/v1/public/weekly-schedule`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (publicRes.ok) {
        const publicJson = await publicRes.json();
        return publicJson.data || [];
      }
    } catch {
      // ignore
    }
    return [];
  },
};


