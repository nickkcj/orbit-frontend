// Enrollment Types for Orbit Frontend

export interface CourseEnrollment {
  id: string;
  tenant_id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  last_lesson_id?: string;
  last_accessed_at?: string;
  enrolled_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithCourse extends CourseEnrollment {
  course_title: string;
  course_slug: string;
  course_thumbnail?: string;
  course_total_lessons: number;
  author_name: string;
  author_avatar?: string;
}

export interface ContinueLearningCourse extends EnrollmentWithCourse {
  course_module_count: number;
  last_lesson_title?: string;
  last_module_title?: string;
}

export interface LessonProgress {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  watch_duration_seconds: number;
  video_total_seconds?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonWithProgress {
  id: string;
  title: string;
  position: number;
  duration_minutes?: number;
  is_free_preview: boolean;
  video_id?: string;
  module_id: string;
  module_title: string;
  module_position: number;
  video_duration?: number;
  video_thumbnail?: string;
  progress_status: 'not_started' | 'in_progress' | 'completed';
  progress_completed_at?: string;
}

export interface ModuleWithLessonsProgress {
  module_id: string;
  module_title: string;
  position: number;
  lessons: LessonWithProgress[];
}

export interface EnrollmentWithProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  last_lesson_id?: string;
  last_accessed_at?: string;
  enrolled_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  course_title: string;
  course_slug: string;
  course_thumbnail?: string;
  course_total_lessons: number;
  course_module_count: number;
  course_description?: string;
  author_name: string;
  author_avatar?: string;
}

export interface NextLesson {
  id: string;
  title: string;
  position: number;
  module_id: string;
  module_title: string;
  module_position: number;
}

export interface CoursePlayerData {
  enrollment: EnrollmentWithProgress;
  modules: ModuleWithLessonsProgress[];
  next_lesson?: NextLesson;
}

export interface LessonForPlayer {
  id: string;
  tenant_id: string;
  module_id: string;
  title: string;
  description?: string;
  content?: string;
  content_format: 'markdown' | 'json' | 'html';
  video_id?: string;
  position: number;
  duration_minutes?: number;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
  module_title: string;
  module_position: number;
  course_id: string;
  course_title: string;
  course_slug: string;
  video_title?: string;
  video_playback_url?: string;
  video_thumbnail_url?: string;
  video_duration?: number;
  video_status?: string;
  progress_id?: string;
  progress_status?: 'not_started' | 'in_progress' | 'completed';
  progress_watch_duration?: number;
  progress_completed_at?: string;
}

export interface PreviousNextLesson {
  id: string;
  title: string;
  module_position: number;
  lesson_position: number;
}

export interface LessonPlayerResponse {
  lesson: LessonForPlayer;
  enrollment_id?: string;
  previous_lesson?: PreviousNextLesson;
  next_lesson?: PreviousNextLesson;
  is_preview?: boolean;
  course_id?: string;
  course_title?: string;
}

export interface MarkLessonCompleteResponse {
  progress: LessonProgress;
  enrollment_progress: number;
  completed_count: number;
  total_count: number;
}

// Request types
export interface EnrollRequest {
  course_id: string;
}

export interface UpdateVideoProgressRequest {
  watch_duration_seconds: number;
  video_total_seconds?: number;
}

// Response types
export interface EnrollmentStatusResponse {
  enrolled: boolean;
  enrollment?: EnrollmentWithProgress;
}

export interface EnrollmentsListResponse {
  enrollments: EnrollmentWithCourse[];
  total: number;
  limit: number;
  offset: number;
}

export interface CourseEnrollmentsListResponse {
  enrollments: Array<CourseEnrollment & {
    user_name: string;
    user_email: string;
    user_avatar?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
