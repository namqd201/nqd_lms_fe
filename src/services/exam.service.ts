import {
  TeacherExamRequest,
  TeacherExamResponse,
  ExamFilterParams,
  ExamStatus,
  ExamVisibility,
  TeacherExamStudentCandidateResponse,
  StudentAssignedExamResponse,
  StudentExamTakingResponse,
  SubmitExamAttemptRequest,
  StudentAttemptResultResponse,
  TeacherExamResultsSummaryResponse,
  TeacherExamAttemptDetailResponse,
  StudentExamAttemptReviewResponse,
  ExamAttemptEventRequest,
  ExamAttemptEventBatchResponse,
  ExamPaperExportParams,
} from '@/types/exam';
import { handleApiResponse } from '@/utils/errorMessage';

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

function buildExamExportQuery(params?: ExamPaperExportParams): string {
  const query = new URLSearchParams();
  if (params) {
    if (params.institutionName?.trim()) query.append('institutionName', params.institutionName.trim());
    if (params.departmentName?.trim()) query.append('departmentName', params.departmentName.trim());
    if (params.examTitle?.trim()) query.append('examTitle', params.examTitle.trim());
    if (params.academicYear?.trim()) query.append('academicYear', params.academicYear.trim());
    if (params.subjectName?.trim()) query.append('subjectName', params.subjectName.trim());
    if (params.gradeLevel?.trim()) query.append('gradeLevel', params.gradeLevel.trim());
    if (params.durationMinutes) query.append('durationMinutes', String(params.durationMinutes));
    if (params.includeAnswerKey !== undefined) query.append('includeAnswerKey', String(params.includeAnswerKey));
    if (params.instructionNote?.trim()) query.append('instructionNote', params.instructionNote.trim());
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const examService = {
  getTeacherExams: async (params?: ExamFilterParams): Promise<TeacherExamResponse[]> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.subjectId && params.subjectId !== 'ALL') query.append('subjectId', params.subjectId);
      if (params.courseId && params.courseId !== 'ALL') query.append('courseId', params.courseId);
      if (params.gradeLevel && params.gradeLevel !== 'ALL') query.append('gradeLevel', params.gradeLevel);
      if (params.status && params.status !== ('ALL' as ExamStatus)) query.append('status', params.status);
      if (params.visibility && params.visibility !== ('ALL' as any)) query.append('visibility', params.visibility);
      if (params.keyword && params.keyword.trim()) query.append('keyword', params.keyword.trim());
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse[]>(response, 'Không thể tải danh sách đề thi');
  },

  getSharedLibrary: async (params?: {
    subjectId?: string;
    gradeLevel?: string;
    keyword?: string;
  }): Promise<TeacherExamResponse[]> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.subjectId && params.subjectId !== 'ALL') query.append('subjectId', params.subjectId);
      if (params.gradeLevel && params.gradeLevel !== 'ALL') query.append('gradeLevel', params.gradeLevel);
      if (params.keyword && params.keyword.trim()) query.append('keyword', params.keyword.trim());
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/shared-library${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse[]>(response, 'Không thể tải thư viện đề thi dùng chung');
  },

  cloneExam: async (id: string): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Sao chép đề thi thất bại');
  },

  updateExamVisibility: async (
    id: string,
    visibility: ExamVisibility
  ): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visibility }),
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Cập nhật quyền hiển thị đề thi thất bại');
  },

  getAdminExams: async (params?: ExamFilterParams): Promise<TeacherExamResponse[]> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.subjectId && params.subjectId !== 'ALL') query.append('subjectId', params.subjectId);
      if (params.courseId && params.courseId !== 'ALL') query.append('courseId', params.courseId);
      if (params.gradeLevel && params.gradeLevel !== 'ALL') query.append('gradeLevel', params.gradeLevel);
      if (params.status && params.status !== ('ALL' as ExamStatus)) query.append('status', params.status);
      if (params.keyword && params.keyword.trim()) query.append('keyword', params.keyword.trim());
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/exams${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse[]>(response, 'Không thể tải danh sách đề thi quản trị');
  },

  updateAdminExamVisibility: async (
    id: string,
    visibility: ExamVisibility
  ): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/exams/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visibility }),
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Cập nhật quyền duyệt hiển thị đề thi thất bại');
  },


  getExamById: async (id: string): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Không thể tải chi tiết đề thi');
  },

  createExam: async (data: TeacherExamRequest): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Tạo đề thi mới thất bại');
  },

  updateExam: async (
    id: string,
    data: TeacherExamRequest
  ): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Cập nhật đề thi thất bại');
  },

  publishExam: async (id: string): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Xuất bản đề thi thất bại');
  },

  archiveExam: async (id: string): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Lưu trữ đề thi thất bại');
  },

  deleteExam: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<void>(response, 'Xóa đề thi thất bại');
  },

  getDeletedExams: async (): Promise<TeacherExamResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/trash`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse[]>(response, 'Không thể tải lịch sử đề thi đã xóa');
  },

  restoreExam: async (id: string): Promise<TeacherExamResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${id}/restore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResponse>(response, 'Khôi phục đề thi thất bại');
  },

  getEligibleStudents: async (examId: string): Promise<TeacherExamStudentCandidateResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${examId}/eligible-students`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamStudentCandidateResponse[]>(response, 'Không thể tải danh sách học viên dự thi');
  },

  assignStudents: async (examId: string, studentIds: string[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${examId}/assign-students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ studentIds }),
    });

    return handleApiResponse<void>(response, 'Giao bài kiểm tra thất bại');
  },

  getExamResults: async (examId: string): Promise<TeacherExamResultsSummaryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${examId}/results`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamResultsSummaryResponse>(response, 'Không thể tải kết quả bài kiểm tra');
  },

  getAttemptDetail: async (attemptId: string): Promise<TeacherExamAttemptDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/attempts/${attemptId}/detail`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<TeacherExamAttemptDetailResponse>(response, 'Không thể tải chi tiết bài làm của học sinh');
  },

  // Student Endpoints
  getMyAssignedExams: async (): Promise<StudentAssignedExamResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/my-assigned-exams`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAssignedExamResponse[]>(response, 'Không thể tải danh sách bài kiểm tra được giao');
  },

  startExam: async (examId: string): Promise<StudentExamTakingResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/${examId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentExamTakingResponse>(response, 'Không thể bắt đầu làm bài kiểm tra');
  },

  submitExam: async (attemptId: string, payload: SubmitExamAttemptRequest): Promise<StudentAttemptResultResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleApiResponse<StudentAttemptResultResponse>(response, 'Nộp bài kiểm tra thất bại');
  },

  getAttemptResult: async (attemptId: string): Promise<StudentAttemptResultResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/attempts/${attemptId}/result`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAttemptResultResponse>(response, 'Không thể tải kết quả bài kiểm tra');
  },

  getMyExamAttempts: async (examId: string): Promise<StudentAttemptResultResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/${examId}/my-attempts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentAttemptResultResponse[]>(response, 'Không thể tải lịch sử làm bài kiểm tra');
  },

  getStudentAttemptReview: async (attemptId: string): Promise<StudentExamAttemptReviewResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/attempts/${attemptId}/review`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<StudentExamAttemptReviewResponse>(response, 'Không thể tải xem lại bài làm');
  },

  recordAttemptEvents: async (
    attemptId: string,
    events: ExamAttemptEventRequest[]
  ): Promise<ExamAttemptEventBatchResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/exams/attempts/${attemptId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(events),
    });

    return handleApiResponse<ExamAttemptEventBatchResponse>(response, 'Ghi nhận sự kiện giám sát thất bại');
  },

  /**
   * Export Exam Paper to Word (.docx)
   */
  exportExamDocx: async (
    examId: string,
    params?: ExamPaperExportParams,
    customFilename?: string
  ): Promise<void> => {
    const qs = buildExamExportQuery(params);
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${examId}/export/docx${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tải đề thi định dạng Word. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `De_Thi_${new Date().toISOString().slice(0, 10)}.docx`;
    triggerBlobDownload(blob, filename);
  },

  /**
   * Export Exam Paper to PDF (.pdf)
   */
  exportExamPdf: async (
    examId: string,
    params?: ExamPaperExportParams,
    customFilename?: string
  ): Promise<void> => {
    const qs = buildExamExportQuery(params);
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/exams/${examId}/export/pdf${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tải đề thi định dạng PDF. Vui lòng thử lại.');
    }

    const blob = await response.blob();
    const filename = customFilename || `De_Thi_${new Date().toISOString().slice(0, 10)}.pdf`;
    triggerBlobDownload(blob, filename);
  },
};
