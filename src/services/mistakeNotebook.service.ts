import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type MistakeMasteryStatus = 'LEARNING' | 'REVIEWING' | 'MASTERED';

export interface MistakeOptionDto {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

export interface StudentMistakeNoteDto {
  id: string;
  questionId: string;
  subjectId?: string | null;
  subjectName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  courseId?: string | null;
  sourceType?: string | null;
  questionType: string;
  difficulty: string;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  explanation?: string | null;
  options: MistakeOptionDto[];
  wrongCount: number;
  correctReviewCount: number;
  consecutiveCorrectCount: number;
  masteryStatus: MistakeMasteryStatus;
  lastWrongAt?: string | null;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  dueForReview: boolean;
  personalNote?: string | null;
}

export interface MistakeNotebookSummaryResponse {
  totalMistakes: number;
  dueForReviewCount: number;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
  items: StudentMistakeNoteDto[];
}

export interface QuestionReviewOutcome {
  questionId: string;
  correct: boolean;
  correctOptionId?: string | null;
  explanation?: string | null;
  previousStatus: MistakeMasteryStatus;
  newStatus: MistakeMasteryStatus;
  consecutiveCorrectCount: number;
  nextReviewAt?: string | null;
}

export interface MistakePracticeResultResponse {
  totalReviewed: number;
  correctCount: number;
  newlyMasteredCount: number;
  outcomes: QuestionReviewOutcome[];
}

export const mistakeNotebookService = {
  getMyMistakeNotebook: async (params?: {
    subjectId?: string;
    status?: string;
    dueOnly?: boolean;
  }): Promise<MistakeNotebookSummaryResponse> => {
    const query = new URLSearchParams();
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.dueOnly) query.set('dueOnly', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/student/mistake-notebook${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<MistakeNotebookSummaryResponse>(
      response,
      'Không thể tải Sổ tay câu hỏi hay sai'
    );
  },

  submitPracticeReview: async (
    answers: Array<{ questionId: string; selectedOptionId?: string; answerText?: string }>
  ): Promise<MistakePracticeResultResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/mistake-notebook/practice/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answers }),
    });

    return handleApiResponse<MistakePracticeResultResponse>(
      response,
      'Nộp bài ôn tập thông minh thất bại'
    );
  },

  updatePersonalNote: async (
    mistakeNoteId: string,
    personalNote: string
  ): Promise<StudentMistakeNoteDto> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/student/mistake-notebook/${mistakeNoteId}/note`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personalNote }),
      }
    );

    return handleApiResponse<StudentMistakeNoteDto>(response, 'Lưu ghi chú cá nhân thất bại');
  },

  deleteMistakeNote: async (mistakeNoteId: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/student/mistake-notebook/${mistakeNoteId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      await handleApiResponse(response, 'Xóa câu hỏi khỏi sổ tay thất bại');
    }
  },
};
