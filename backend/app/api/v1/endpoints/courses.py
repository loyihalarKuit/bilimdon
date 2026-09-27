from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, OptionalUser
from app.models import Course, CourseLevel, Enrollment, Lesson
from app.schemas.common import Page
from app.schemas.course import CourseDetail, CourseListItem, LessonOut
from app.schemas.learning import CourseProgress
from app.services import courses as course_service
from app.services.progress import get_course_progress

router = APIRouter(prefix="/courses", tags=["courses"])


def get_visible_course(db: DbSession, slug: str, user) -> Course:
    course = course_service.get_course_by_slug(db, slug)
    if course is None or (
        not course.is_published and not (user and course_service.can_manage_course(user, course))
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kurs topilmadi")
    return course


@router.get("", response_model=Page[CourseListItem])
def list_courses(
    db: DbSession,
    search: Annotated[str | None, Query(max_length=100)] = None,
    category: str | None = None,
    level: CourseLevel | None = None,
    featured: bool | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=50)] = 12,
):
    courses, total = course_service.list_courses(
        db, search=search, category_slug=category, level=level, featured=featured, page=page, size=size
    )
    return Page(items=course_service.to_list_items(db, courses), total=total, page=page, size=size)


@router.get("/{slug}", response_model=CourseDetail)
def get_course(slug: str, db: DbSession, user: OptionalUser):
    course = get_visible_course(db, slug, user)
    return course_service.build_course_detail(db, course, user)


@router.post("/{slug}/enroll", response_model=CourseProgress, status_code=status.HTTP_201_CREATED)
def enroll(slug: str, db: DbSession, user: CurrentUser):
    course = get_visible_course(db, slug, user)
    if not course_service.is_enrolled(db, user.id, course.id):
        db.add(Enrollment(user_id=user.id, course_id=course.id))
        db.commit()
    return get_course_progress(db, user, course)


@router.get("/{slug}/progress", response_model=CourseProgress)
def course_progress(slug: str, db: DbSession, user: CurrentUser):
    course = get_visible_course(db, slug, user)
    return get_course_progress(db, user, course)


@router.get("/{slug}/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(slug: str, lesson_id: int, db: DbSession, user: OptionalUser):
    course = get_visible_course(db, slug, user)
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id, Lesson.course_id == course.id))
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dars topilmadi")

    has_access = lesson.is_preview or (
        user is not None
        and (course_service.is_enrolled(db, user.id, course.id) or course_service.can_manage_course(user, course))
    )
    if not has_access:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Darsni ko'rish uchun kursga yoziling")
    return lesson
