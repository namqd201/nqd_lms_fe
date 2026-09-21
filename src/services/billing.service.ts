import { OrderResponse } from '@/types/billing';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const billingService = {
  createCourseOrder: async (courseId: string, couponCode?: string): Promise<OrderResponse> => {
    const params = new URLSearchParams();
    if (couponCode && couponCode.trim()) {
      params.append('couponCode', couponCode.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/course/${courseId}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể tạo đơn hàng mua khóa học');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  createChapterOrder: async (chapterId: string, couponCode?: string): Promise<OrderResponse> => {
    const params = new URLSearchParams();
    if (couponCode && couponCode.trim()) {
      params.append('couponCode', couponCode.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/chapter/${chapterId}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể tạo đơn hàng mua chương học');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  createLessonOrder: async (lessonId: string, couponCode?: string): Promise<OrderResponse> => {
    const params = new URLSearchParams();
    if (couponCode && couponCode.trim()) {
      params.append('couponCode', couponCode.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/lesson/${lessonId}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể tạo đơn hàng mua bài học');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  createMembershipOrder: async (planId: string, couponCode?: string): Promise<OrderResponse> => {
    const params = new URLSearchParams();
    if (couponCode && couponCode.trim()) {
      params.append('couponCode', couponCode.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/membership/${planId}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể tạo đơn hàng đăng ký gói hội viên');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  getOrderByCode: async (orderCode: string): Promise<OrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/code/${encodeURIComponent(orderCode)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể lấy thông tin đơn hàng');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  getMyOrders: async (page: number = 0, size: number = 10, status?: string): Promise<{ content: OrderResponse[]; totalElements: number; totalPages: number }> => {
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/me?page=${page}&size=${size}${statusParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể lấy danh sách đơn hàng');
    const data = res.data ?? res;
    return {
      content: data.content ?? data.items ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  getAdminOrders: async (
    page: number = 0,
    size: number = 10,
    status?: string,
    search?: string
  ): Promise<{ content: OrderResponse[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    if (status) params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/orders?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể lấy danh sách đơn hàng hệ thống');
    const data = res.data ?? res;
    return {
      content: data.content ?? data.items ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  cancelOrder: async (orderCode: string, reason?: string): Promise<OrderResponse> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/${encodeURIComponent(orderCode)}/cancel${query}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<{ data: OrderResponse } | OrderResponse>(response, 'Không thể hủy đơn hàng');
    return (res as { data: OrderResponse }).data ?? (res as OrderResponse);
  },

  initiatePayment: async (orderId: string, paymentMethod: string = 'PAYOS'): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId, paymentMethod }),
    });
    const res = await handleApiResponse<any>(response, 'Không thể khởi tạo mã thanh toán QR');
    return res.data ?? res;
  },

  getPaymentConfig: async (): Promise<{ provider: string; bankCode: string; accountNumber: string; accountName: string; currency: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/config`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể lấy cấu hình thanh toán');
    return res.data ?? res;
  },

  simulatePaymentSuccess: async (orderCode: string, amount: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode,
        transferAmount: amount,
        amount,
        status: 'PAID',
        transferType: 'in',
        content: orderCode,
        description: 'Thanh toan don hang ' + orderCode,
      }),
    });
    return await response.json();
  },
};