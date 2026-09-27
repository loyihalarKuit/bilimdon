from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.models import Category, Course
from app.schemas.course import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


def list_categories_with_counts(db: DbSession, published_only: bool = True) -> list[CategoryOut]:
    join_cond = Course.category_id == Category.id
    if published_only:
        join_cond &= Course.is_published.is_(True)
    rows = db.execute(
        select(Category, func.count(Course.id))
        .outerjoin(Course, join_cond)
        .group_by(Category.id)
        .order_by(Category.name)
    )
    result = []
    for category, count in rows:
        item = CategoryOut.model_validate(category)
        item.course_count = count
        result.append(item)
    return result


@router.get("", response_model=list[CategoryOut])
def list_categories(db: DbSession):
    return list_categories_with_counts(db)
