"""Barcha modellar shu yerda import qilinadi — Alembic ularni shu orqali topadi."""

from app.core.database import Base
from app.models.course import Category, Course, CourseLevel, Lesson
from app.models.learning import Certificate, Enrollment, LessonProgress, QuizAttempt
from app.models.quiz import AnswerOption, Question, Quiz
from app.models.user import User, UserRole

__all__ = [
    "AnswerOption",
    "Base",
    "Category",
    "Certificate",
    "Course",
    "CourseLevel",
    "Enrollment",
    "Lesson",
    "LessonProgress",
    "Question",
    "Quiz",
    "QuizAttempt",
    "User",
    "UserRole",
]
