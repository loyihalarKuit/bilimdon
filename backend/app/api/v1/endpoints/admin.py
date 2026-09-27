"""O'qituvchi va administratorlar uchun boshqaruv endpointlari."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, StaffUser
from app.api.v1.endpoints.categories import list_categories_with_counts
from app.models import (
    AnswerOption,
    Category,
    Certificate,
    Course,
    Enrollment,
    Lesson,
    Question,
    Quiz,
    User,
    UserRole,
)
from app.schemas.common import Page
from app.schemas.course import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    CourseAdminDetail,
    CourseCreate,
    CourseListItem,
    CourseUpdate,
    LessonCreate,
    LessonOut,
    LessonUpdate,
)
from app.schemas.learning import AdminStats
from app.schemas.quiz import QuizAdminOut, QuizUpsert
from app.schemas.user import UserOut, UserRoleUpdate
from app.services import courses as course_service
from app.services.slug import unique_slug

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Yordamchi funksiyalar ----------
def _get_managed_course(db: DbSession, course_id: int, user: User) -> Course:
    course = db.scalar(
        select(Course)
        .options(selectinload(Course.lessons), selectinload(Course.category), selectinload(Course.instructor))
        .where(Course.id == course_id)
    )
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kurs topilmadi")
    if not course_service.can_manage_course(user, course):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu kursni boshqarishga ruxsat yo'q")
    return course


def _check_category(db: DbSession, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Kategoriya topilmadi")


def _admin_detail(db: DbSession, course: Course, user: User) -> CourseAdminDetail:
    detail = course_service.build_course_detail(db, course, user)
    data = detail.model_dump(exclude={"lessons"})
    return CourseAdminDetail(**data, lessons=[LessonOut.model_validate(l) for l in course.lessons])


# ---------- Statistika ----------
@router.get("/stats", response_model=AdminStats)
def stats(db: DbSession, _: StaffUser):
    count = lambda model, *where: db.scalar(select(func.count()).select_from(model).where(*where)) or 0  # noqa: E731
    return AdminStats(
        users=count(User),
        courses=count(Course),
        published_courses=count(Course, Course.is_published.is_(True)),
        enrollments=count(Enrollment),
        certificates=count(Certificate),
    )


# ---------- Kurslar ----------
@router.get("/courses", response_model=Page[CourseListItem])
def list_courses(
    db: DbSession,
    user: StaffUser,
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    courses, total = course_service.list_courses(
        db,
        search=search,
        published_only=False,
        instructor_id=None if user.role == UserRole.ADMIN else user.id,
        page=page,
        size=size,
    )
    return Page(items=course_service.to_list_items(db, courses), total=total, page=page, size=size)


@router.post("/courses", response_model=CourseAdminDetail, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: DbSession, user: StaffUser):
    _check_category(db, payload.category_id)
    course = Course(**payload.model_dump(), slug=unique_slug(db, Course, payload.title), instructor_id=user.id)
    db.add(course)
    db.commit()
    return _admin_detail(db, _get_managed_course(db, course.id, user), user)


@router.get("/courses/{course_id}", response_model=CourseAdminDetail)
def get_course(course_id: int, db: DbSession, user: StaffUser):
    return _admin_detail(db, _get_managed_course(db, course_id, user), user)


@router.patch("/courses/{course_id}", response_model=CourseAdminDetail)
def update_course(course_id: int, payload: CourseUpdate, db: DbSession, user: StaffUser):
    course = _get_managed_course(db, course_id, user)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _check_category(db, data["category_id"])
    if "title" in data and data["title"] != course.title:
        course.slug = unique_slug(db, Course, data["title"], exclude_id=course.id)
    for key, value in data.items():
        setattr(course, key, value)
    db.commit()
    return _admin_detail(db, _get_managed_course(db, course.id, user), user)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: DbSession, user: StaffUser):
    db.delete(_get_managed_course(db, course_id, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Darslar ----------
@router.post("/courses/{course_id}/lessons", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(course_id: int, payload: LessonCreate, db: DbSession, user: StaffUser):
    course = _get_managed_course(db, course_id, user)
    data = payload.model_dump()
    if data["position"] is None:
        data["position"] = max((l.position for l in course.lessons), default=0) + 1
    lesson = Lesson(course_id=course.id, **data)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def _get_managed_lesson(db: DbSession, lesson_id: int, user: User) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dars topilmadi")
    _get_managed_course(db, lesson.course_id, user)
    return lesson


@router.patch("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(lesson_id: int, payload: LessonUpdate, db: DbSession, user: StaffUser):
    lesson = _get_managed_lesson(db, lesson_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, key, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: int, db: DbSession, user: StaffUser):
    db.delete(_get_managed_lesson(db, lesson_id, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Testlar ----------
def _fill_quiz(quiz: Quiz, payload: QuizUpsert) -> None:
    quiz.title = payload.title
    quiz.description = payload.description
    quiz.pass_score = payload.pass_score
    quiz.lesson_id = payload.lesson_id
    quiz.questions = [
        Question(
            text=q.text,
            position=i,
            options=[AnswerOption(text=o.text, is_correct=o.is_correct) for o in q.options],
        )
        for i, q in enumerate(payload.questions)
    ]


def _check_quiz_lesson(db: DbSession, course_id: int, lesson_id: int | None) -> None:
    if lesson_id is None:
        return
    if db.scalar(select(Lesson.id).where(Lesson.id == lesson_id, Lesson.course_id == course_id)) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Dars bu kursga tegishli emas")


def _get_managed_quiz(db: DbSession, quiz_id: int, user: User) -> Quiz:
    quiz = db.scalar(
        select(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .where(Quiz.id == quiz_id)
    )
    if quiz is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Test topilmadi")
    _get_managed_course(db, quiz.course_id, user)
    return quiz


@router.post("/courses/{course_id}/quizzes", response_model=QuizAdminOut, status_code=status.HTTP_201_CREATED)
def create_quiz(course_id: int, payload: QuizUpsert, db: DbSession, user: StaffUser):
    course = _get_managed_course(db, course_id, user)
    _check_quiz_lesson(db, course.id, payload.lesson_id)
    quiz = Quiz(course_id=course.id)
    _fill_quiz(quiz, payload)
    db.add(quiz)
    db.commit()
    return _get_managed_quiz(db, quiz.id, user)


@router.get("/quizzes/{quiz_id}", response_model=QuizAdminOut)
def get_quiz(quiz_id: int, db: DbSession, user: StaffUser):
    return _get_managed_quiz(db, quiz_id, user)


@router.put("/quizzes/{quiz_id}", response_model=QuizAdminOut)
def replace_quiz(quiz_id: int, payload: QuizUpsert, db: DbSession, user: StaffUser):
    quiz = _get_managed_quiz(db, quiz_id, user)
    _check_quiz_lesson(db, quiz.course_id, payload.lesson_id)
    _fill_quiz(quiz, payload)
    db.commit()
    db.expire_all()
    return _get_managed_quiz(db, quiz.id, user)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: DbSession, user: StaffUser):
    db.delete(_get_managed_quiz(db, quiz_id, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Kategoriyalar (faqat admin) ----------
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DbSession, _: StaffUser):
    return list_categories_with_counts(db, published_only=False)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: DbSession, _: AdminUser):
    if db.scalar(select(Category.id).where(func.lower(Category.name) == payload.name.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "Bunday kategoriya mavjud")
    category = Category(**payload.model_dump(), slug=unique_slug(db, Category, payload.name))
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: DbSession, _: AdminUser):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kategoriya topilmadi")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != category.name:
        category.slug = unique_slug(db, Category, data["name"], exclude_id=category.id)
    for key, value in data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: DbSession, _: AdminUser):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kategoriya topilmadi")
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Foydalanuvchilar (faqat admin) ----------
@router.get("/users", response_model=Page[UserOut])
def list_users(
    db: DbSession,
    _: AdminUser,
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    stmt = select(User)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(User.full_name.ilike(pattern) | User.email.ilike(pattern))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    users = db.scalars(stmt.order_by(User.id.desc()).offset((page - 1) * size).limit(size))
    return Page(items=list(users), total=total, page=page, size=size)


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(user_id: int, payload: UserRoleUpdate, db: DbSession, admin: AdminUser):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Foydalanuvchi topilmadi")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "O'z rolingizni o'zgartira olmaysiz")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
