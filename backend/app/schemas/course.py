from datetime import datetime

from pydantic import BaseModel, Field

from app.models.course import CourseLevel
from app.schemas.common import ORMModel


class CategoryOut(ORMModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    icon: str | None = None
    course_count: int = 0


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=50)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=50)


class CategoryBrief(ORMModel):
    id: int
    name: str
    slug: str
    icon: str | None = None


class InstructorBrief(ORMModel):
    id: int
    full_name: str


class LessonBrief(ORMModel):
    id: int
    title: str
    duration_minutes: int
    position: int
    is_preview: bool


class LessonOut(LessonBrief):
    course_id: int
    content: str
    video_url: str | None = None


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    content: str = ""
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int = Field(default=0, ge=0)
    position: int | None = Field(default=None, ge=0)
    is_preview: bool = False


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    content: str | None = None
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(default=None, ge=0)
    position: int | None = Field(default=None, ge=0)
    is_preview: bool | None = None


class QuizBrief(ORMModel):
    id: int
    title: str
    lesson_id: int | None = None
    pass_score: int
    question_count: int = 0


class CourseListItem(ORMModel):
    id: int
    title: str
    slug: str
    short_description: str
    thumbnail_url: str | None = None
    level: CourseLevel
    price: int
    is_featured: bool
    is_published: bool
    category: CategoryBrief | None = None
    instructor: InstructorBrief | None = None
    lesson_count: int = 0
    total_minutes: int = 0
    student_count: int = 0


class CourseDetail(CourseListItem):
    description: str
    created_at: datetime
    updated_at: datetime
    lessons: list[LessonBrief] = []
    quizzes: list[QuizBrief] = []
    is_enrolled: bool = False


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    short_description: str = Field(min_length=10, max_length=300)
    description: str = ""
    thumbnail_url: str | None = Field(default=None, max_length=500)
    level: CourseLevel = CourseLevel.BEGINNER
    price: int = Field(default=0, ge=0)
    category_id: int | None = None
    is_published: bool = False
    is_featured: bool = False


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    short_description: str | None = Field(default=None, min_length=10, max_length=300)
    description: str | None = None
    thumbnail_url: str | None = Field(default=None, max_length=500)
    level: CourseLevel | None = None
    price: int | None = Field(default=None, ge=0)
    category_id: int | None = None
    is_published: bool | None = None
    is_featured: bool | None = None


class CourseAdminDetail(CourseDetail):
    lessons: list[LessonOut] = []
