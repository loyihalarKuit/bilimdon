from sqlalchemy.orm import Session

from app.models import Quiz, QuizAttempt, User
from app.schemas.quiz import QuestionResult, QuizSubmit


def grade_quiz(db: Session, user: User, quiz: Quiz, submission: QuizSubmit) -> tuple[QuizAttempt, list[QuestionResult]]:
    selected = {answer.question_id: answer.option_id for answer in submission.answers}
    results: list[QuestionResult] = []
    correct_count = 0

    for question in quiz.questions:
        correct = next((o.id for o in question.options if o.is_correct), None)
        chosen = selected.get(question.id)
        is_correct = chosen is not None and chosen == correct
        correct_count += is_correct
        results.append(
            QuestionResult(
                question_id=question.id,
                selected_option_id=chosen,
                correct_option_id=correct,
                is_correct=is_correct,
            )
        )

    total = len(quiz.questions)
    score = round(correct_count * 100 / total) if total else 0
    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz.id,
        score=score,
        correct_count=correct_count,
        total_count=total,
        passed=score >= quiz.pass_score,
    )
    db.add(attempt)
    db.commit()
    return attempt, results
