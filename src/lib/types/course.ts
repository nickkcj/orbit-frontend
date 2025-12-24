// Course Types for Orbit Frontend

export interface Course {
  id: string;
  tenant_id: string;
  author_id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  module_count: number;
  lesson_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author_name?: string;
  author_avatar?: string;
}

export interface Module {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description?: string;
  position: number;
  lesson_count: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
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
  // Joined video fields
  video_title?: string;
  video_playback_url?: string;
  video_thumbnail_url?: string;
  video_duration?: number;
  video_status?: string;
}

export interface ModuleWithLessons {
  module: Module;
  lessons: Lesson[];
}

export interface CourseStructure {
  course: Course;
  modules: ModuleWithLessons[];
}

// Request types
export interface CreateCourseRequest {
  title: string;
  description?: string;
  thumbnail_url?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail_url?: string;
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  content?: string;
  content_format?: string;
  video_id?: string;
  duration_minutes?: number;
  is_free_preview?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  content?: string;
  content_format?: string;
  video_id?: string;
  duration_minutes?: number;
  is_free_preview?: boolean;
}

export interface ReorderRequest {
  position: number;
}
