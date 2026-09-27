from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.security import hash_password, verify_password
from app.schemas.common import Message
from app.schemas.user import PasswordChange, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, user: CurrentUser, db: DbSession):
    user.full_name = payload.full_name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/password", response_model=Message)
def change_password(payload: PasswordChange, user: CurrentUser, db: DbSession):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Joriy parol noto'g'ri")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return Message(detail="Parol yangilandi")
