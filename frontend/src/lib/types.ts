export type UserRole = "student" | "instructor" | "admin";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  course_count: number;
}

export interface CategoryBrief {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export interface LessonBrief {
  id: number;
  title: string;
  duration_minutes: number;
  position: number;
  is_preview: boolean;
}

export interface Lesson extends LessonBrief {
  course_id: number;
  content: string;
  video_url: string | null;
}

export interface QuizBrief {
  id: number;
  title: string;
  lesson_id: number | null;
  pass_score: number;
  question_count: number;
}

export interface CourseListItem {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  thumbnail_url: string | null;
  level: CourseLevel;
  price: number;
  is_featured: boolean;
  is_published: boolean;
  category: CategoryBrief | null;
  instructor: { id: number; full_name: string } | null;
  lesson_count: number;
  total_minutes: number;
  student_count: number;
}

export interface CourseDetail extends CourseListItem {
  description: string;
  created_at: string;
  updated_at: string;
  lessons: LessonBrief[];
  quizzes: QuizBrief[];
  is_enrolled: boolean;
}

export interface CourseAdminDetail extends Omit<CourseDetail, "lessons"> {
  lessons: Lesson[];
}

export interface QuizProgress {
  quiz_id: number;
  title: string;
  best_score: number | null;
  passed: boolean;
  attempts: number;
}

export interface CourseProgress {
  course_id: number;
  is_enrolled: boolean;
  completed_lesson_ids: number[];
  total_lessons: number;
  quizzes: QuizProgress[];
  progress_percent: number;
  is_completed: boolean;
  certificate_code: string | null;
  next_lesson_id: number | null;
}

export interface MyCourse {
  course: CourseListItem;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  next_lesson_id: number | null;
  certificate_code: string | null;
}

export interface DashboardStats {
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  certificates: number;
  completed_lessons: number;
  quizzes_passed: number;
}

export interface Certificate {
  code: string;
  issued_at: string;
  student_name: string;
  course_title: string;
  course_slug: string;
  instructor_name: string | null;
  total_minutes: number;
}

export interface QuizPublic {
  id: number;
  course_id: number;
  lesson_id: number | null;
  title: string;
  description: string;
  pass_score: number;
  questions: { id: number; text: string; options: { id: number; text: string }[] }[];
}

export interface QuizResult {
  quiz_id: number;
  score: number;
  correct_count: number;
  total_count: number;
  passed: boolean;
  pass_score: number;
  results: {
    question_id: number;
    selected_option_id: number | null;
    correct_option_id: number | null;
    is_correct: boolean;
  }[];
  course_completed: boolean;
  certificate_code: string | null;
}

export interface QuizAdmin {
  id: number;
  course_id: number;
  lesson_id: number | null;
  title: string;
  description: string;
  pass_score: number;
  questions: { id: number; text: string; options: { id: number; text: string; is_correct: boolean }[] }[];
}

export interface AdminStats {
  users: number;
  courses: number;
  published_courses: number;
  enrollments: number;
  certificates: number;
}
