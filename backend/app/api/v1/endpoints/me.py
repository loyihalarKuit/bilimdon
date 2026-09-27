from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models import Certificate, Course, Enrollment, LessonProgress, QuizAttempt
from app.schemas.learning import CertificateOut, DashboardStats, MyCourse
from app.services import courses as course_service
from app.services.certificates import to_certificate_out
from app.services.progress import get_course_progress

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/courses", response_model=list[MyCourse])
def my_courses(db: DbSession, user: CurrentUser):
    enrollments = list(
        db.scalars(
            select(Enrollment)
            .options(
                selectinload(Enrollment.course).selectinload(Course.category),
                selectinload(Enrollment.course).selectinload(Course.instructor),
                selectinload(Enrollment.course).selectinload(Course.lessons),
            )
            .where(Enrollment.user_id == user.id)
            .order_by(Enrollment.enrolled_at.desc())
        )
    )
    stats = course_service.get_course_stats(db, [e.course_id for e in enrollments])
    result = []
    for enrollment in enrollments:
        progress = get_course_progress(db, user, enrollment.course)
        result.append(
            MyCourse(
                course=course_service.to_list_item(enrollment.course, stats[enrollment.course_id]),
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
                progress_percent=progress.progress_percent,
                completed_lessons=len(progress.completed_lesson_ids),
                total_lessons=progress.total_lessons,
                next_lesson_id=progress.next_lesson_id,
                certificate_code=progress.certificate_code,
            )
        )
    return result


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: DbSession, user: CurrentUser):
    enrolled = db.scalar(select(func.count()).where(Enrollment.user_id == user.id)) or 0
    completed = (
        db.scalar(
            select(func.count()).where(Enrollment.user_id == user.id, Enrollment.completed_at.is_not(None))
        )
        or 0
    )
    passed_quizzes = (
        db.scalar(
            select(func.count(func.distinct(QuizAttempt.quiz_id))).where(
                QuizAttempt.user_id == user.id, QuizAttempt.passed.is_(True)
            )
        )
        or 0
    )
    return DashboardStats(
        enrolled_courses=enrolled,
        completed_courses=completed,
        in_progress_courses=enrolled - completed,
        certificates=db.scalar(select(func.count()).where(Certificate.user_id == user.id)) or 0,
        completed_lessons=db.scalar(select(func.count()).where(LessonProgress.user_id == user.id)) or 0,
        quizzes_passed=passed_quizzes,
    )


@router.get("/certificates", response_model=list[CertificateOut])
def my_certificates(db: DbSession, user: CurrentUser):
    certificates = db.scalars(
        select(Certificate)
        .options(selectinload(Certificate.course).selectinload(Course.instructor), selectinload(Certificate.user))
        .where(Certificate.user_id == user.id)
        .order_by(Certificate.issued_at.desc())
    )
    return [to_certificate_out(db, c) for c in certificates]
