from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models import Course, Lesson, LessonProgress, Question, Quiz
from app.schemas.learning import CourseProgress
from app.schemas.quiz import QuizPublic, QuizResult, QuizSubmit
from app.services import courses as course_service
from app.services.progress import get_course_progress, sync_course_completion
from app.services.quizzes import grade_quiz

router = APIRouter(tags=["learning"])


def _require_enrollment(db: DbSession, user, course_id: int) -> Course:
    course = db.scalar(select(Course).options(selectinload(Course.lessons)).where(Course.id == course_id))
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kurs topilmadi")
    if not course_service.is_enrolled(db, user.id, course.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Avval kursga yoziling")
    return course


def _get_lesson(db: DbSession, lesson_id: int) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dars topilmadi")
    return lesson


@router.post("/lessons/{lesson_id}/complete", response_model=CourseProgress)
def complete_lesson(lesson_id: int, db: DbSession, user: CurrentUser):
    lesson = _get_lesson(db, lesson_id)
    course = _require_enrollment(db, user, lesson.course_id)
    exists = db.scalar(
        select(LessonProgress.id).where(LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id)
    )
    if exists is None:
        db.add(LessonProgress(user_id=user.id, lesson_id=lesson.id))
        db.commit()
    return sync_course_completion(db, user, course)


@router.delete("/lessons/{lesson_id}/complete", response_model=CourseProgress)
def uncomplete_lesson(lesson_id: int, db: DbSession, user: CurrentUser):
    lesson = _get_lesson(db, lesson_id)
    course = _require_enrollment(db, user, lesson.course_id)
    db.execute(
        delete(LessonProgress).where(LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id)
    )
    db.commit()
    return get_course_progress(db, user, course)


def _load_quiz(db: DbSession, quiz_id: int) -> Quiz:
    quiz = db.scalar(
        select(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .where(Quiz.id == quiz_id)
    )
    if quiz is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test topilmadi")
    return quiz


@router.get("/quizzes/{quiz_id}", response_model=QuizPublic)
def get_quiz(quiz_id: int, db: DbSession, user: CurrentUser):
    quiz = _load_quiz(db, quiz_id)
    _require_enrollment(db, user, quiz.course_id)
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResult)
def submit_quiz(quiz_id: int, payload: QuizSubmit, db: DbSession, user: CurrentUser):
    quiz = _load_quiz(db, quiz_id)
    course = _require_enrollment(db, user, quiz.course_id)
    attempt, results = grade_quiz(db, user, quiz, payload)
    progress = sync_course_completion(db, user, course)
    return QuizResult(
        quiz_id=quiz.id,
        score=attempt.score,
        correct_count=attempt.correct_count,
        total_count=attempt.total_count,
        passed=attempt.passed,
        pass_score=quiz.pass_score,
        results=results,
        course_completed=progress.is_completed,
        certificate_code=progress.certificate_code,
    )
