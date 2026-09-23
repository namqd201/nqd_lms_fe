export interface KnowledgeQuestion {
  id: string;
  questionOrder: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface KnowledgeLesson {
  id: string;
  lessonOrder: number;
  title: string;
  slug?: string;
  summary?: string;
  theoryMarkdown?: string;
  estimatedMinutes?: number;
  status: string;
  questions?: KnowledgeQuestion[];
}

export interface KnowledgeChapter {
  id: string;
  chapterOrder: number;
  title: string;
  description?: string;
  lessons: KnowledgeLesson[];
}

export interface KnowledgeCurriculum {
  id: string;
  code: string;
  title: string;
  description?: string;
  gradeLevel: string;
  educationTier?: string;
  subjectCode?: string;
  subjectName?: string;
  thumbnailUrl?: string;
  totalChapters: number;
  totalLessons: number;
  chapters: KnowledgeChapter[];
}
