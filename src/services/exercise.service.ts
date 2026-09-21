import {
  TeacherExerciseResponse,
  TeacherExerciseRequest,
  TeacherExerciseQuestionItemRequest,
  StudentExerciseSummaryResponse,
  StudentExerciseTakingResponse,
  StudentExerciseSubmitQuestionRequest,
  StudentExerciseQuestionResultResponse,
  StudentExerciseAttemptResultResponse,
  StudentExerciseAiExplainResponse,
  ExerciseStatus,
} from '@/types/exercise';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function handleApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'Có lỗi xảy ra khi gọi API (' + res.status + ')';
    try {
      const errJson = await res.json();
      if (errJson.message) errorMsg = errJson.message;
      else if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const exerciseService = {
  // Teacher endpoints
  async getTeacherExercises(params?: {
    lessonId?: string;
    courseId?: string;
    subjectId?: string;
    status?: ExerciseStatus;
    keyword?: string;
  }): Promise<TeacherExerciseResponse[]> {
    const query = new URLSearchParams();
    if (params?.lessonId) query.append('lessonId', params.lessonId);
    if (params?.courseId) query.append('courseId', params.courseId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.status) query.append('status', params.status);
    if (params?.keyword) query.append('keyword', params.keyword);

    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherExerciseResponse[]>(res);
  },

  async getTeacherExerciseById(id: string): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async createExercise(data: TeacherExerciseRequest): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async updateExercise(id: string, data: TeacherExerciseRequest): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async publishExercise(id: string): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${id}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async archiveExercise(id: string): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${id}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async deleteExercise(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<{ message: string }>(res);
  },

  async addQuestionToExercise(
    exerciseId: string,
    data: TeacherExerciseQuestionItemRequest
  ): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${exerciseId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  async removeQuestionFromExercise(exerciseId: string, questionId: string): Promise<TeacherExerciseResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/teacher/exercises/${exerciseId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<TeacherExerciseResponse>(res);
  },

  // Student endpoints
  async getStudentExercisesByLesson(lessonId: string): Promise<StudentExerciseSummaryResponse[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/lesson/${lessonId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseSummaryResponse[]>(res);
  },

  async getStudentExerciseById(id: string): Promise<StudentExerciseSummaryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseSummaryResponse>(res);
  },

  async startExercise(exerciseId: string): Promise<StudentExerciseTakingResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/${exerciseId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseTakingResponse>(res);
  },

  async submitQuestion(
    attemptId: string,
    data: StudentExerciseSubmitQuestionRequest
  ): Promise<StudentExerciseQuestionResultResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/attempts/${attemptId}/submit-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleApiResponse<StudentExerciseQuestionResultResponse>(res);
  },

  async submitAttempt(attemptId: string): Promise<StudentExerciseAttemptResultResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseAttemptResultResponse>(res);
  },

  async getAttemptResult(attemptId: string): Promise<StudentExerciseAttemptResultResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/attempts/${attemptId}/result`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseAttemptResultResponse>(res);
  },

  async getMyAttempts(exerciseId: string): Promise<StudentExerciseAttemptResultResponse[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/student/exercises/${exerciseId}/my-attempts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<StudentExerciseAttemptResultResponse[]>(res);
  },

  async explainQuestionWithAi(
    attemptId: string,
    questionId: string,
    customPrompt?: string
  ): Promise<StudentExerciseAiExplainResponse> {
    const query = new URLSearchParams();
    if (customPrompt) query.append('customPrompt', customPrompt);

    const res = await fetch(
      `${API_BASE_URL}/api/v1/student/exercises/attempts/${attemptId}/questions/${questionId}/ai-explain?${query.toString()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }
    );
    return handleApiResponse<StudentExerciseAiExplainResponse>(res);
  },
};
