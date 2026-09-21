export interface CourseAnnouncementResponse {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  title: string;
  content: string;
  postedAt: string;
}

export interface CreateCourseAnnouncementRequest {
  title: string;
  content: string;
}
