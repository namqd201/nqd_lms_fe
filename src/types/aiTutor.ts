export type StudentAiTutorMode =
  | 'EXPLAIN_LESSON'
  | 'EXPLAIN_WRONG_ANSWER'
  | 'PROVIDE_HINT'
  | 'RECOMMEND_STUDY'
  | 'EXPLAIN_CONCEPT'
  | 'GENERAL_QA';

export interface StudentAiAttachmentDto {
  fileName: string;
  fileType: string;
  base64Data?: string;
  fileUrl?: string;
  extractedText?: string;
}

export interface StudentAiChatMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp?: string;
  attachments?: StudentAiAttachmentDto[];
}

export interface StudentStudyRecommendationDto {
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  topic?: string;
  reason?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  currentScoreAverage?: number;
}

export interface AiTutorConversationDto {
  id: string;
  title: string;
  mode: StudentAiTutorMode;
  courseId?: string;
  lessonId?: string;
  examAttemptId?: string;
  questionId?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface AiTutorMessageDto {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  attachments?: StudentAiAttachmentDto[];
  recommendations?: StudentStudyRecommendationDto[];
  createdAt: string;
}

export interface AiTutorConversationDetailDto {
  id: string;
  title: string;
  mode: StudentAiTutorMode;
  courseId?: string;
  lessonId?: string;
  examAttemptId?: string;
  questionId?: string;
  createdAt: string;
  updatedAt: string;
  messages: AiTutorMessageDto[];
}

export interface CreateAiTutorConversationRequest {
  title: string;
  mode?: StudentAiTutorMode;
  courseId?: string;
  lessonId?: string;
  examAttemptId?: string;
  questionId?: string;
}

export interface StudentAiTutorRequest {
  conversationId?: string;
  question: string;
  mode?: StudentAiTutorMode;
  courseId?: string;
  lessonId?: string;
  examAttemptId?: string;
  questionId?: string;
  attachments?: StudentAiAttachmentDto[];
  conversationHistory?: StudentAiChatMessage[];
}

export interface StudentAiTutorResponse {
  conversationId?: string;
  conversationTitle?: string;
  answer: string;
  hint?: string;
  context?: string;
  contextSummary?: string;
  mode: StudentAiTutorMode;
  remainingRequests?: number;
  recommendations?: StudentStudyRecommendationDto[];
}
