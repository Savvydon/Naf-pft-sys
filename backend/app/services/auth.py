import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from ..schemas import TokenData

# ── SECRET & JWT CONFIG ─────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── PASSWORD HELPERS ────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    bcrypt only supports passwords up to 72 bytes.
    We truncate safely before verifying.
    """
    truncated = plain_password.encode("utf-8")[:72]
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password safely with bcrypt.
    """
    truncated = password.encode("utf-8")[:72]
    return pwd_context.hash(truncated)


# ── JWT TOKEN CREATION ─────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# ── GET CURRENT USER ───────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        svc_no: str = payload.get("sub")

        if svc_no is None:
            raise credentials_exception

        token_data = TokenData(svc_no=svc_no)

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.svc_no == token_data.svc_no).first()

    if user is None:
        raise credentials_exception

    return user


# ── ROLE PROTECTION ─────────────────────────────────

async def require_evaluator(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != "evaluator":
        raise HTTPException(
            status_code=403,
            detail="Evaluator access required"
        )

    return current_user


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


# ── SUPER ADMIN ACCESS REQUIREMENT ──────────────────

async def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        )

    return current_user