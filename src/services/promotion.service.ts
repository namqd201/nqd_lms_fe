import { PromotionEventDto, UpsertPromotionEventRequest } from '@/types/promotion';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const promotionService = {
  getActivePromotion: async (): Promise<PromotionEventDto | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/promotions/active`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await handleApiResponse<any>(response, 'Không thể tải sự kiện giảm giá đang hoạt động');
      return res.data ?? res ?? null;
    } catch {
      return null;
    }
  },

  getAllPromotionsAdmin: async (): Promise<PromotionEventDto[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách sự kiện giảm giá');
    return res.data ?? res ?? [];
  },

  getPromotionById: async (id: string): Promise<PromotionEventDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải chi tiết sự kiện giảm giá');
    return res.data ?? res;
  },

  createPromotion: async (data: UpsertPromotionEventRequest): Promise<PromotionEventDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể tạo sự kiện giảm giá');
    return res.data ?? res;
  },

  updatePromotion: async (id: string, data: UpsertPromotionEventRequest): Promise<PromotionEventDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const res = await handleApiResponse<any>(response, 'Không thể cập nhật sự kiện giảm giá');
    return res.data ?? res;
  },

  togglePromotion: async (id: string): Promise<PromotionEventDto> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể đổi trạng thái sự kiện');
    return res.data ?? res;
  },

  deletePromotion: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/promotions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa sự kiện giảm giá');
  },
};
