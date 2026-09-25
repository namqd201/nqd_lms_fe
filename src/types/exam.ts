import { TeacherQuestionResponse, QuestionType, QuestionDifficulty } from './question';

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ExamVisibility = 'PRIVATE' | 'SUBJECT_SHARED' | 'PUBLIC';
export type ExamAttemptEventType =
  | 'TAB_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'DEVTOOLS_OPEN'
  | 'RESUME'
  | 'OTHER';

export interface ExamAttemptEventRequest {
  eventType: ExamAttemptEventType;
  occurredAt?: string;
  metadata?: string;
  isViolation?: boolean;
}

export interface ExamAttemptEventDto {
  id: string;
  attemptId: string;
  eventType: ExamAttemptEventType;
  occurredAt: string;
  metadata?: string;
  isViolation: boolean;
  createdAt?: string;
}

export interface ExamAttemptEventBatchResponse {
  attemptId: string;
  violationCount: number;
  maxViolationCount: number;
  isFlagged: boolean;
  isAutoSubmitted: boolean;
  message: string;
}

export interface TeacherExamRequest {
  subjectId: string;
  courseId?: string;
  code?: string;
  gradeLevel?: string;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks?: number;
  passingMarks?: number;
  maxAttempts?: number;
  maxListeningPlays?: number;
  audioUrl?: string;
  audioScript?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  enableProctoring?: boolean;
  maxViolationCount?: number;
  status?: ExamStatus;
  visibility?: ExamVisibility;
  questionIds?: string[];
}

export interface TeacherExamResponse {
  id: string;
  code?: string;
  gradeLevel?: string;
  subjectId: string;
  subjectName?: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  maxListeningPlays?: number;
  audioUrl?: string;
  audioScript?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  enableProctoring?: boolean;
  maxViolationCount?: number;
  status: ExamStatus;
  visibility?: ExamVisibility;
  originExamId?: string;
  originExamTitle?: string;
  creatorId?: string;
  creatorName?: string;
  questionCount: number;
  questions?: TeacherQuestionResponse[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ExamFilterParams {
  subjectId?: string;
  courseId?: string;
  gradeLevel?: string;
  status?: ExamStatus;
  visibility?: ExamVisibility;
  keyword?: string;
}

export interface TeacherExamStudentCandidateResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  courseId: string;
  courseName: string;
  isAssigned: boolean;
  assignedAt?: string;
}

export interface AssignStudentsToExamRequest {
  studentIds: string[];
}

export interface StudentAssignedExamResponse {
  examId: string;
  code?: string;
  title: string;
  description?: string;
  instructions?: string;
  subjectId?: string;
  subjectName?: string;
  gradeLevel?: string;
  courseId?: string;
  courseName?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  questionCount: number;
  enableProctoring?: boolean;
  maxViolationCount?: number;
  status: ExamStatus;
  attemptsTaken: number;
  bestScore?: number;
  passed?: boolean;
  assignedAt?: string;
  teacherName?: string;
}

export interface StudentOptionTakingResponse {
  id: string;
  optionKey: string;
  optionText: string;
  displayOrder: number;
}

export interface StudentQuestionTakingResponse {
  questionId: string;
  content: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  displayOrder: number;
  audioUrl?: string;
  options: StudentOptionTakingResponse[];
}

export interface StudentExamTakingResponse {
  examId: string;
  attemptId: string;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  attemptNumber: number;
  startedAt: string;
  audioUrl?: string;
  maxListeningPlays?: number;
  enableProctoring?: boolean;
  maxViolationCount?: number;
  violationCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  questions: StudentQuestionTakingResponse[];
}

export interface StudentAnswerSubmissionDto {
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
}

export interface SubmitExamAttemptRequest {
  answers: StudentAnswerSubmissionDto[];
}

export interface StudentAttemptResultResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  violationCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface TeacherExamStudentAttemptResponse {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  correctAnswersCount?: number;
  totalQuestionsCount?: number;
  violationCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface TeacherExamResultsSummaryResponse {
  examId: string;
  examCode: string;
  title: string;
  subjectName?: string;
  gradeLevel?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  questionCount: number;
  totalAssigned: number;
  totalSubmissions: number;
  passedCount: number;
  averageScore: number;
  highestScore: number;
  attempts: TeacherExamStudentAttemptResponse[];
}

export interface TeacherExamAttemptAnswerDetailResponse {
  questionId: string;
  displayOrder: number;
  content: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  maxMarks: number;
  marksAwarded: number;
  isCorrect: boolean;
  studentSelectedOptionId?: string;
  studentSelectedOptionKey?: string;
  studentSelectedOptionText?: string;
  studentAnswerText?: string;
  correctOptionKey?: string;
  correctOptionText?: string;
  explanation?: string;
  audioUrl?: string;
  audioScript?: string;
  options: {
    id?: string;
    optionKey: string;
    optionText: string;
    isCorrect?: boolean;
    displayOrder?: number;
  }[];
}

export interface TeacherExamAttemptDetailResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  examCode: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  violationCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  events?: ExamAttemptEventDto[];
  answers: TeacherExamAttemptAnswerDetailResponse[];
}

export interface StudentExamAnswerReviewResponse {
  questionId: string;
  displayOrder: number;
  content: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  maxMarks: number;
  marksAwarded: number;
  isCorrect: boolean;
  studentSelectedOptionId?: string;
  studentSelectedOptionKey?: string;
  studentSelectedOptionText?: string;
  studentAnswerText?: string;
  correctOptionKey?: string;
  correctOptionText?: string;
  explanation?: string;
  audioUrl?: string;
  audioScript?: string;
  options: {
    id?: string;
    optionKey: string;
    optionText: string;
    isCorrect?: boolean;
    displayOrder?: number;
  }[];
}

export interface StudentExamAttemptReviewResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  examCode: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  audioUrl?: string;
  audioScript?: string;
  maxListeningPlays?: number;
  answers: StudentExamAnswerReviewResponse[];
}

export interface ExamPaperExportParams {
  institutionName?: string;
  departmentName?: string;
  examTitle?: string;
  academicYear?: string;
  subjectName?: string;
  gradeLevel?: string;
  durationMinutes?: number;
  includeAnswerKey?: boolean;
  instructionNote?: string;
}



