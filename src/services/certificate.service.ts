import { CertificateResponse, CertificateVerificationResponse } from '@/types/certificate';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const certificateService = {
  getMyCertificates: async (): Promise<CertificateResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/certificates/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách chứng chỉ của bạn');
    return Array.isArray(res) ? res : res.data ?? [];
  },

  getCertificateById: async (id: string): Promise<CertificateResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/certificates/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải thông tin chứng chỉ');
    return res.data ?? res;
  },

  verifyCertificate: async (code: string): Promise<CertificateVerificationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/public/certificates/verify/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await handleApiResponse<any>(response, 'Không thể xác thực chứng chỉ');
    return res.data ?? res;
  },

  getDownloadPdfUrl: (id: string): string => {
    return `${API_BASE_URL}/api/v1/certificates/${id}/download`;
  },

  checkEligibility: async (courseId: string): Promise<import('@/types/certificate').CertificateEligibilityResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/certificates/courses/${courseId}/eligibility`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể kiểm tra điều kiện nhận chứng chỉ');
    return res.data ?? res;
  },

  claimCertificate: async (courseId: string): Promise<CertificateResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/certificates/courses/${courseId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể nhận chứng chỉ');
    return res.data ?? res;
  },
};
