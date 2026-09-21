export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'FILL_IN_THE_BLANK'
  | 'ESSAY';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type QuestionStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface TeacherQuestionOptionDto {
  id?: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder?: number;
}

export type QuestionCategoryVisibility = 'PUBLIC' | 'TEACHER_SHARED' | 'PRIVATE';

export interface QuestionCategoryRequest {
  name: string;
  code?: string;
  description?: string;
  subjectId: string;
  gradeLevel?: string;
  parentId?: string;
  displayOrder?: number;
  visibility?: QuestionCategoryVisibility;
  isSystem?: boolean;
}

export interface QuestionCategoryResponse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  gradeLevel?: string;
  parentId?: string;
  parentName?: string;
  displayOrder?: number;
  creatorId?: string;
  creatorName?: string;
  visibility?: QuestionCategoryVisibility;
  isSystem?: boolean;
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherQuestionRequest {
  subjectId: string;
  categoryId?: string;
  courseId?: string;
  lessonId?: string;
  gradeLevel?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  content: string;
  explanation?: string;
  defaultMarks?: number;
  status?: QuestionStatus;
  tags?: string[];
  options?: TeacherQuestionOptionDto[];
}

export interface TeacherQuestionResponse {
  id: string;
  subjectId: string;
  subjectName?: string;
  categoryId?: string;
  categoryName?: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonTitle?: string;
  gradeLevel?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  content: string;
  explanation?: string;
  defaultMarks: number;
  status: QuestionStatus;
  creatorId?: string;
  creatorName?: string;
  tags?: string[];
  options: TeacherQuestionOptionDto[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface QuestionFilterParams {
  subjectId?: string;
  categoryId?: string;
  courseId?: string;
  lessonId?: string;
  gradeLevel?: string;
  questionType?: QuestionType;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  tag?: string;
  keyword?: string;
}

export interface QuestionPaperExportParams {
  institutionName?: string;
  departmentName?: string;
  examTitle?: string;
  academicYear?: string;
  subjectName?: string;
  gradeLevel?: string;
  durationMinutes?: number;
  instructionNote?: string;
}

export interface QuestionPaperExportRequest {
  questionIds?: string[];
  subjectId?: string;
  categoryId?: string;
  gradeLevel?: string;
  params?: QuestionPaperExportParams;
}

