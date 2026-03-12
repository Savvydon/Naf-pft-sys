from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas import UserLogin, Token, UserOut
from app.services.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.services.database import get_db
from app.services.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.svc_no == form_data.svc_no).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect service number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.svc_no})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user