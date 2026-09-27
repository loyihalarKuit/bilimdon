from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Category, Course, CourseLevel, Enrollment, Lesson, Quiz, User, UserRole
from app.models.quiz import Question
from app.schemas.course import CourseDetail, CourseListItem, QuizBrief


@dataclass
class CourseStats:
    lesson_count: int = 0
    total_minutes: int = 0
    student_count: int = 0


def get_course_stats(db: Session, course_ids: list[int]) -> dict[int, CourseStats]:
    stats = {cid: CourseStats() for cid in course_ids}
    if not course_ids:
        return stats

    lesson_rows = db.execute(
        select(Lesson.course_id, func.count(Lesson.id), func.coalesce(func.sum(Lesson.duration_minutes), 0))
        .where(Lesson.course_id.in_(course_ids))
        .group_by(Lesson.course_id)
    )
    for course_id, count, minutes in lesson_rows:
        stats[course_id].lesson_count = count
        stats[course_id].total_minutes = int(minutes)

    student_rows = db.execute(
        select(Enrollment.course_id, func.count(Enrollment.id))
        .where(Enrollment.course_id.in_(course_ids))
        .group_by(Enrollment.course_id)
    )
    for course_id, count in student_rows:
        stats[course_id].student_count = count
    return stats


def to_list_item(course: Course, stats: CourseStats) -> CourseListItem:
    item = CourseListItem.model_validate(course)
    item.lesson_count = stats.lesson_count
    item.total_minutes = stats.total_minutes
    item.student_count = stats.student_count
    return item


def to_list_items(db: Session, courses: list[Course]) -> list[CourseListItem]:
    stats = get_course_stats(db, [c.id for c in courses])
    return [to_list_item(c, stats[c.id]) for c in courses]


def _base_query():
    return select(Course).options(selectinload(Course.category), selectinload(Course.instructor))


def list_courses(
    db: Session,
    *,
    search: str | None = None,
    category_slug: str | None = None,
    level: CourseLevel | None = None,
    featured: bool | None = None,
    published_only: bool = True,
    instructor_id: int | None = None,
    page: int = 1,
    size: int = 12,
) -> tuple[list[Course], int]:
    stmt = _base_query()
    if published_only:
        stmt = stmt.where(Course.is_published.is_(True))
    if instructor_id is not None:
        stmt = stmt.where(Course.instructor_id == instructor_id)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(or_(Course.title.ilike(pattern), Course.short_description.ilike(pattern)))
    if category_slug:
        stmt = stmt.join(Course.category).where(Category.slug == category_slug)
    if level:
        stmt = stmt.where(Course.level == level)
    if featured is not None:
        stmt = stmt.where(Course.is_featured.is_(featured))

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    stmt = stmt.order_by(Course.is_featured.desc(), Course.created_at.desc(), Course.id.desc())
    courses = list(db.scalars(stmt.offset((page - 1) * size).limit(size)))
    return courses, total


def get_course_by_slug(db: Session, slug: str) -> Course | None:
    return db.scalar(
        _base_query().options(selectinload(Course.lessons)).where(Course.slug == slug)
    )


def build_course_detail(db: Session, course: Course, user: User | None) -> CourseDetail:
    stats = get_course_stats(db, [course.id])[course.id]
    detail = CourseDetail.model_validate(course)
    detail.lesson_count = stats.lesson_count
    detail.total_minutes = stats.total_minutes
    detail.student_count = stats.student_count

    quiz_rows = db.execute(
        select(Quiz, func.count(Question.id))
        .outerjoin(Question, Question.quiz_id == Quiz.id)
        .where(Quiz.course_id == course.id)
        .group_by(Quiz.id)
        .order_by(Quiz.id)
    )
    detail.quizzes = [
        QuizBrief(
            id=quiz.id, title=quiz.title, lesson_id=quiz.lesson_id,
            pass_score=quiz.pass_score, question_count=count,
        )
        for quiz, count in quiz_rows
    ]
    if user is not None:
        detail.is_enrolled = is_enrolled(db, user.id, course.id)
    return detail


def is_enrolled(db: Session, user_id: int, course_id: int) -> bool:
    return (
        db.scalar(
            select(Enrollment.id).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        is not None
    )


def can_manage_course(user: User, course: Course) -> bool:
    return user.role == UserRole.ADMIN or course.instructor_id == user.id
