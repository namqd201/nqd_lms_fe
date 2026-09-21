import { ExportCustomizationParams } from '@/types/report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function triggerBlobDownload(blob: Blob, defaultFilename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function buildExportQuery(params?: ExportCustomizationParams): string {
  const query = new URLSearchParams();
  if (params) {
    if (params.institutionName?.trim()) query.append('institutionName', params.institutionName.trim());
    if (params.reportTitle?.trim()) query.append('reportTitle', params.reportTitle.trim());
    if (params.academicYear?.trim()) query.append('academicYear', params.academicYear.trim());
    if (params.signerTitle?.trim()) query.append('signerTitle', params.signerTitle.trim());
    if (params.notes?.trim()) query.append('notes', params.notes.trim());
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const reportService = {
  /**
   * Export Teacher Course Gradebook to Excel (.xlsx)
   */
  exportCourseGradebookExcel: async (
    courseId: string,
    params?: ExportCustomizationParams,
    customFilename?: string
  ): Promise<void> => {
    const qs = buildExportQuery(params);
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/courses/${courseId}/report.xlsx${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể xuất bảng điểm lớp học. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `Bang_Diem_Lop_Hoc_${new Date().toISOString().slice(0, 10)}.xlsx`;
    triggerBlobDownload(blob, filename);
  },

  /**
   * Export Student Personal Academic Transcript to PDF (.pdf)
   */
  exportStudentTranscriptPdf: async (
    params?: ExportCustomizationParams,
    customFilename?: string
  ): Promise<void> => {
    const qs = buildExportQuery(params);
    const response = await fetch(`${API_BASE_URL}/api/v1/student/me/transcript.pdf${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tải bảng điểm cá nhân. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `Bang_Diem_Hoc_Tap_Ca_Nhan_${new Date().toISOString().slice(0, 10)}.pdf`;
    triggerBlobDownload(blob, filename);
  },

  /**
   * Export Admin Platform Overview to Excel (.xlsx)
   */
  exportAdminPlatformOverviewExcel: async (
    params?: ExportCustomizationParams,
    customFilename?: string
  ): Promise<void> => {
    const qs = buildExportQuery(params);
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/reports/platform.xlsx${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể xuất báo cáo quản trị nền tảng. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `Bao_Cao_Tong_Quan_He_Thong_${new Date().toISOString().slice(0, 10)}.xlsx`;
    triggerBlobDownload(blob, filename);
  },
};
