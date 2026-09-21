export type ExerciseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ExerciseType = 'PRACTICE' | 'HOMEWORK' | 'QUIZ';
export type ExerciseAttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface TeacherExerciseOptionResponse {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface TeacherExerciseQuestionResponse {
  questionId: string;
  displayOrder: number;
  marks: number;
  content: string;
  questionType: string;
  difficulty: string;
  explanation?: string;
  options: TeacherExerciseOptionResponse[];
}

export interface TeacherExerciseResponse {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  courseId?: string;
  courseTitle?: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  description?: string;
  instructions?: string;
  type: ExerciseType;
  timeLimitMinutes?: number;
  passingScore?: number;
  status: ExerciseStatus;
  maxAttempts?: number;
  showExplanationImmediately?: boolean;
  allowRetry?: boolean;
  questionCount: number;
  totalMarks: number;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
  questions?: TeacherExerciseQuestionResponse[];
}

export interface TeacherExerciseQuestionItemRequest {
  questionId: string;
  marks?: number;
  displayOrder?: number;
}

export interface TeacherExerciseRequest {
  lessonId: string;
  title: string;
  description?: string;
  instructions?: string;
  type?: ExerciseType;
  timeLimitMinutes?: number;
  passingScore?: number;
  status?: ExerciseStatus;
  maxAttempts?: number;
  showExplanationImmediately?: boolean;
  allowRetry?: boolean;
  questions?: TeacherExerciseQuestionItemRequest[];
}

// Student types
export interface StudentExerciseSummaryResponse {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  title: string;
  description?: string;
  instructions?: string;
  type: ExerciseType;
  timeLimitMinutes?: number;
  passingScore?: number;
  questionCount: number;
  totalMarks: number;
  maxAttempts?: number;
  showExplanationImmediately: boolean;
  allowRetry: boolean;
  userAttemptsCount: number;
  userBestScore?: number;
  userBestPercentage?: number;
  userPassed?: boolean;
  hasInProgressAttempt?: boolean;
  inProgressAttemptId?: string;
  cooldownRemainingSeconds?: number;
  attemptCycleCount?: number;
  maxCycleAttempts?: number;
}

export interface StudentExerciseOptionTakingResponse {
  id: string;
  optionKey: string;
  optionText: string;
  displayOrder: number;
}

export interface StudentExerciseQuestionTakingResponse {
  questionId: string;
  displayOrder: number;
  marks: number;
  content: string;
  questionType: string;
  difficulty: string;
  options: StudentExerciseOptionTakingResponse[];
}

export interface StudentExerciseQuestionResultResponse {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionKey?: string;
  answerText?: string;
  isCorrect?: boolean;
  correctOptionId?: string;
  correctOptionKey?: string;
  explanation?: string;
  marksAwarded?: number;
  maxMarks: number;
  aiExplanation?: string;
  answeredAt?: string;
}

export interface StudentExerciseTakingResponse {
  exerciseId: string;
  attemptId: string;
  attemptNumber: number;
  title: string;
  description?: string;
  instructions?: string;
  type: ExerciseType;
  timeLimitMinutes?: number;
  passingScore?: number;
  showExplanationImmediately: boolean;
  allowRetry: boolean;
  startedAt: string;
  totalQuestions: number;
  totalMarks: number;
  questions: StudentExerciseQuestionTakingResponse[];
  answeredQuestions: StudentExerciseQuestionResultResponse[];
  cooldownRemainingSeconds?: number;
  attemptCycleCount?: number;
  maxCycleAttempts?: number;
}

export interface StudentExerciseSubmitQuestionRequest {
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
}

export interface StudentExerciseAttemptResultResponse {
  attemptId: string;
  exerciseId: string;
  exerciseTitle: string;
  attemptNumber: number;
  status: ExerciseAttemptStatus;
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  totalQuestions: number;
  canRetry: boolean;
  remainingAttempts?: number;
  cooldownRemainingSeconds?: number;
  attemptCycleCount?: number;
  maxCycleAttempts?: number;
  questionResults: StudentExerciseQuestionResultResponse[];
}

export interface StudentExerciseAiExplainResponse {
  questionId: string;
  questionContent: string;
  studentAnswer?: string;
  correctAnswer?: string;
  explanation: string;
}
