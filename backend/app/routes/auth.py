from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas import UserLogin, Token, UserOut, UserRegister
from app.services.auth import (
    create_access_token,
    get_current_user,
    verify_password,
    get_password_hash
)
from app.services.database import get_db
from app.services.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


# ── REGISTER USER ───────────────────────────────────

@router.post("/register")
def register_user(
    data: UserRegister,
    db: Session = Depends(get_db)
):

    svc_no = data.svc_no.strip().upper()

    existing_user = db.query(User).filter(User.svc_no == svc_no).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Service number already registered"
        )

    hashed_password = get_password_hash(data.password)

    new_user = User(
        svc_no=svc_no,
        full_name=data.full_name.strip(),
        rank=data.rank.strip(),
        email=data.email,
        hashed_password=hashed_password,
        role="evaluator"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "svc_no": new_user.svc_no
    }


# ── LOGIN ───────────────────────────────────────────

@router.post("/login", response_model=Token)
def login_for_access_token(
    data: UserLogin,
    db: Session = Depends(get_db)
):

    svc_no = data.svc_no.strip().upper()

    user = db.query(User).filter(User.svc_no == svc_no).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service number not registered"
        )

    if user.full_name.lower().strip() != data.full_name.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Name does not match service number"
        )

    if user.rank.lower().strip() != data.rank.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Rank does not match service number"
        )

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


# ── CURRENT USER ────────────────────────────────────

@router.get("/me", response_model=UserOut)
def read_users_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "svc_no": current_user.svc_no,
        "full_name": current_user.full_name,
        "rank": current_user.rank,
        "role": current_user.role,
        "email": current_user.email
    }