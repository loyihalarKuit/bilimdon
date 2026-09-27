import secrets
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Certificate, Course, Enrollment, Lesson, LessonProgress, Quiz, QuizAttempt, User
from app.schemas.learning import CourseProgress, QuizProgress


def _completed_lesson_ids(db: Session, user_id: int, course_id: int) -> set[int]:
    return set(
        db.scalars(
            select(LessonProgress.lesson_id)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .where(LessonProgress.user_id == user_id, Lesson.course_id == course_id)
        )
    )


def _quiz_progress(db: Session, user_id: int, course_id: int) -> list[QuizProgress]:
    quizzes = list(db.scalars(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.id)))
    if not quizzes:
        return []
    rows = db.execute(
        select(
            QuizAttempt.quiz_id,
            func.max(QuizAttempt.score),
            func.count(QuizAttempt.id),
        )
        .where(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id.in_([q.id for q in quizzes]))
        .group_by(QuizAttempt.quiz_id)
    )
    best = {quiz_id: (score, attempts) for quiz_id, score, attempts in rows}
    result = []
    for quiz in quizzes:
        score, attempts = best.get(quiz.id, (None, 0))
        result.append(
            QuizProgress(
                quiz_id=quiz.id,
                title=quiz.title,
                best_score=score,
                attempts=attempts,
                passed=score is not None and score >= quiz.pass_score,
            )
        )
    return result


def get_course_progress(db: Session, user: User, course: Course) -> CourseProgress:
    enrollment = db.scalar(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
    )
    lesson_ids = [lesson.id for lesson in sorted(course.lessons, key=lambda l: (l.position, l.id))]
    completed = _completed_lesson_ids(db, user.id, course.id)
    quizzes = _quiz_progress(db, user.id, course.id)

    total_items = len(lesson_ids) + len(quizzes)
    done_items = len(completed) + sum(q.passed for q in quizzes)
    percent = round(done_items * 100 / total_items) if total_items else 0

    certificate_code = db.scalar(
        select(Certificate.code).where(Certificate.user_id == user.id, Certificate.course_id == course.id)
    )
    next_lesson_id = next((lid for lid in lesson_ids if lid not in completed), None)

    return CourseProgress(
        course_id=course.id,
        is_enrolled=enrollment is not None,
        completed_lesson_ids=[lid for lid in lesson_ids if lid in completed],
        total_lessons=len(lesson_ids),
        quizzes=quizzes,
        progress_percent=percent,
        is_completed=total_items > 0 and done_items == total_items,
        certificate_code=certificate_code,
        next_lesson_id=next_lesson_id,
    )


def _new_certificate_code(db: Session) -> str:
    while True:
        code = secrets.token_hex(6).upper()
        if db.scalar(select(Certificate.id).where(Certificate.code == code)) is None:
            return code


def sync_course_completion(db: Session, user: User, course: Course) -> CourseProgress:
    """Progressni qayta hisoblaydi; kurs tugagan bo'lsa sertifikat beradi."""
    progress = get_course_progress(db, user, course)
    if not progress.is_enrolled or not progress.is_completed:
        return progress

    enrollment = db.scalar(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
    )
    if enrollment and enrollment.completed_at is None:
        enrollment.completed_at = datetime.now(timezone.utc)

    if progress.certificate_code is None:
        certificate = Certificate(code=_new_certificate_code(db), user_id=user.id, course_id=course.id)
        db.add(certificate)
        try:
            db.commit()
        except IntegrityError:  # parallel so'rov allaqachon yaratgan bo'lsa
            db.rollback()
        progress.certificate_code = db.scalar(
            select(Certificate.code).where(Certificate.user_id == user.id, Certificate.course_id == course.id)
        )
    else:
        db.commit()
    return progress
