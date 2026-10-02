export type SlideTargetType = 'COURSE_LESSON' | 'CLASSROOM_MATERIAL' | 'KNOWLEDGE_LESSON';

export interface SlideItem {
  slideNumber: number;
  title: string;
  subtitle?: string;
  layout?: 'TITLE' | 'INTRO' | 'CONTENT' | 'SPLIT' | 'FORMULA' | 'KEYNOTE' | 'SUMMARY';
  bulletPoints?: string[];
  formula?: string;
  callout?: string;
  speakerNotes?: string;
}

export interface LessonSlideResponse {
  id?: string;
  targetType: SlideTargetType;
  targetId: string;
  title: string;
  slideUrl?: string;
  fileName?: string;
  slideContentJson?: string;
  slides: SlideItem[];
  slideSource?: 'AI_GENERATED' | 'MANUAL_UPLOAD';
  slideCount: number;
  creatorId?: string;
  canManage?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateSlideRequest {
  targetType: SlideTargetType;
  targetId: string;
  slideCount?: number;
  style?: string;
  language?: string;
}
