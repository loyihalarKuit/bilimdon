from datetime import datetime

from pydantic import BaseModel

from app.schemas.course import CourseListItem


class QuizProgress(BaseModel):
    quiz_id: int
    title: str
    best_score: int | None = None
    passed: bool = False
    attempts: int = 0


class CourseProgress(BaseModel):
    course_id: int
    is_enrolled: bool
    completed_lesson_ids: list[int]
    total_lessons: int
    quizzes: list[QuizProgress]
    progress_percent: int
    is_completed: bool
    certificate_code: str | None = None
    next_lesson_id: int | None = None


class MyCourse(BaseModel):
    course: CourseListItem
    enrolled_at: datetime
    completed_at: datetime | None = None
    progress_percent: int
    completed_lessons: int
    total_lessons: int
    next_lesson_id: int | None = None
    certificate_code: str | None = None


class DashboardStats(BaseModel):
    enrolled_courses: int
    completed_courses: int
    in_progress_courses: int
    certificates: int
    completed_lessons: int
    quizzes_passed: int


class CertificateOut(BaseModel):
    code: str
    issued_at: datetime
    student_name: str
    course_title: str
    course_slug: str
    instructor_name: str | None = None
    total_minutes: int = 0


class AdminStats(BaseModel):
    users: int
    courses: int
    published_courses: int
    enrollments: int
    certificates: int
