import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LabRoomItem {
  id: string;
  title: string;
  description?: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl?: string;
  speakerName: string;
  speakerTitle?: string;
  coverImageUrl?: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  estimatedDurationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  isPublic: boolean;
  guestMeetingUrl?: string;
  hostMeetingUrl?: string;
  isHostOrAdmin: boolean;
  maxParticipants: number;
  createdAt: string;
}

export interface CreateLabRoomInput {
  title: string;
  description?: string;
  speakerName: string;
  speakerTitle?: string;
  coverImageUrl?: string;
  scheduledStartTime: string;
  estimatedDurationMinutes?: number;
}

export interface LabRecordedVideoItem {
  id: string;
  labRoomId: string;
  labRoomTitle: string;
  title: string;
  videoUrl: string;
  durationMinutes?: number;
  recordedDate?: string;
  description?: string;
  ownerUserId: string;
  ownerName: string;
  createdAt: string;
}

export interface CreateLabVideoInput {
  title: string;
  videoUrl: string;
  durationMinutes?: number;
  recordedDate?: string;
  description?: string;
}

export const labService = {
  getPublicLabs: async (): Promise<LabRoomItem[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/labs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<LabRoomItem[]>(response, 'Không thể tải danh sách phòng Lab');
  },

  getLabById: async (id: string): Promise<LabRoomItem> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/labs/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<LabRoomItem>(response, 'Không thể tải thông tin phòng Lab');
  },

  createLab: async (data: CreateLabRoomInput): Promise<LabRoomItem> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<LabRoomItem>(response, 'Không thể tạo phòng Lab mới');
  },

  updateStatus: async (id: string, status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'): Promise<LabRoomItem> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<LabRoomItem>(response, 'Không thể cập nhật trạng thái phòng Lab');
  },

  deleteLab: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa phòng Lab');
  },

  // Private recorded videos for Host and Admin
  getMyRecordedVideos: async (): Promise<LabRecordedVideoItem[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/videos/my`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<LabRecordedVideoItem[]>(response, 'Không thể tải video bản ghi phòng Lab');
  },

  saveRecordedVideo: async (labId: string, data: CreateLabVideoInput): Promise<LabRecordedVideoItem> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/${labId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<LabRecordedVideoItem>(response, 'Không thể lưu video bản ghi');
  },

  sync100msRecordings: async (labId: string): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/${labId}/sync-recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<{ success: boolean; syncedCount: number; message: string }>(
      response,
      'Không thể đồng bộ bản ghi video từ 100ms'
    );
  },

  deleteRecordedVideo: async (videoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/labs/videos/${videoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<void>(response, 'Không thể xóa video bản ghi');
  },
};
