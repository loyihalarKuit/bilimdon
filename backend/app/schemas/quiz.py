from pydantic import BaseModel, Field, model_validator

from app.schemas.common import ORMModel


# --- Talaba uchun (to'g'ri javoblar yashirilgan) ---
class OptionPublic(ORMModel):
    id: int
    text: str


class QuestionPublic(ORMModel):
    id: int
    text: str
    options: list[OptionPublic]


class QuizPublic(ORMModel):
    id: int
    course_id: int
    lesson_id: int | None = None
    title: str
    description: str
    pass_score: int
    questions: list[QuestionPublic]


class AnswerIn(BaseModel):
    question_id: int
    option_id: int


class QuizSubmit(BaseModel):
    answers: list[AnswerIn]


class QuestionResult(BaseModel):
    question_id: int
    selected_option_id: int | None
    correct_option_id: int | None
    is_correct: bool


class QuizResult(BaseModel):
    quiz_id: int
    score: int
    correct_count: int
    total_count: int
    passed: bool
    pass_score: int
    results: list[QuestionResult]
    course_completed: bool = False
    certificate_code: str | None = None


# --- Admin/o'qituvchi uchun ---
class OptionAdmin(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


class QuestionAdmin(BaseModel):
    text: str = Field(min_length=2)
    options: list[OptionAdmin] = Field(min_length=2, max_length=8)

    @model_validator(mode="after")
    def exactly_one_correct(self):
        if sum(o.is_correct for o in self.options) != 1:
            raise ValueError("Har bir savolda aynan bitta to'g'ri javob bo'lishi kerak")
        return self


class QuizUpsert(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = ""
    pass_score: int = Field(default=70, ge=1, le=100)
    lesson_id: int | None = None
    questions: list[QuestionAdmin] = Field(min_length=1)


class OptionAdminOut(ORMModel):
    id: int
    text: str
    is_correct: bool


class QuestionAdminOut(ORMModel):
    id: int
    text: str
    options: list[OptionAdminOut]


class QuizAdminOut(ORMModel):
    id: int
    course_id: int
    lesson_id: int | None = None
    title: str
    description: str
    pass_score: int
    questions: list[QuestionAdminOut]
