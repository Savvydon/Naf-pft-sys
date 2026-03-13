from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas import UserLogin, Token, UserOut
from app.services.auth import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.services.database import get_db
from app.services.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login_for_access_token(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login endpoint that verifies:
    - Service number
    - Full name
    - Rank
    - Password
    Returns JWT token and user info
    """
    svc_no = data.svc_no.strip().upper()
    user = db.query(User).filter(User.svc_no == svc_no).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service number not registered"
        )

    # Verify full name
    if user.full_name.lower().strip() != data.full_name.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Name does not match service number"
        )

    # Verify rank
    if user.rank.lower().strip() != data.rank.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Rank does not match service number"
        )

    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    access_token = create_access_token(data={"sub": user.svc_no})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "rank": user.rank
    }


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Returns info of currently authenticated user
    """
    return {
        "svc_no": current_user.svc_no,
        "full_name": current_user.full_name,
        "rank": current_user.rank,
        "role": current_user.role,
        "email": current_user.email
    }