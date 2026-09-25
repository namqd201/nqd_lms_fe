import { QuestionType, QuestionDifficulty } from './question';

export type AiJobType = 'QUESTION_GENERATION' | 'EXAM_GENERATION';
export type AiJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AiValidationStatus = 'VALID' | 'INVALID' | 'WARNING';
export type AiReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface GeneratedOptionDraft {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder?: number;
}

export interface TeacherAiGenerateQuestionsRequest {
  subjectId: string;
  courseId?: string;
  categoryId?: string;
  lessonId?: string;
  gradeLevel?: string;
  topic: string;
  questionType?: QuestionType;
  questionTypes?: QuestionType[];
  difficulty?: QuestionDifficulty;
  numberOfQuestions?: number;
  marksPerQuestion?: number;
  additionalInstructions?: string;
  isListening?: boolean;
  listeningPassageType?: string;
}

export interface ExamBlueprintItemRequest {
  topic?: string;
  questionType?: QuestionType;
  difficulty?: QuestionDifficulty;
  count: number;
  marksPerQuestion: number;
}

export interface TeacherAiGenerateExamRequest {
  subjectId: string;
  courseId?: string;
  title: string;
  gradeLevel?: string;
  topic?: string;
  durationMinutes: number;
  passingMarks: number;
  totalMarks?: number;
  blueprintItems?: ExamBlueprintItemRequest[];
  additionalInstructions?: string;
  isListening?: boolean;
  listeningPassageType?: string;
  maxListeningPlays?: number;
}

export interface TeacherAiGeneratedOptionResponse {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface TeacherAiGeneratedQuestionResponse {
  id: string;
  content: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation?: string;
  tags?: string;
  audioUrl?: string;
  audioScript?: string;
  displayOrder: number;
  validationStatus: AiValidationStatus;
  validationFeedback?: string;
  reviewStatus: AiReviewStatus;
  approvedQuestionId?: string;
  options: TeacherAiGeneratedOptionResponse[];
}

export interface TeacherAiJobResponse {
  id: string;
  jobType: AiJobType;
  status: AiJobStatus;
  promptSummary?: string;
  subjectId: string;
  subjectName: string;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  gradeLevel?: string;
  topic?: string;
  totalRequested: number;
  totalGenerated: number;
  totalApproved: number;
  targetExamTitle?: string;
  targetExamCode?: string;
  targetExamDuration?: number;
  targetExamPassingMarks?: number;
  targetExamTotalMarks?: number;
  createdExamId?: string;
  categoryId?: string;
  categoryName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherAiJobDetailResponse {
  job: TeacherAiJobResponse;
  questions: TeacherAiGeneratedQuestionResponse[];
}

export interface TeacherAiUpdateGeneratedQuestionRequest {
  content: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation?: string;
  tags?: string;
  audioUrl?: string;
  audioScript?: string;
  options: GeneratedOptionDraft[];
}

export interface TeacherAiApproveJobResponse {
  jobId: string;
  approvedQuestionsCount: number;
  createdExamId?: string;
  message: string;
}
