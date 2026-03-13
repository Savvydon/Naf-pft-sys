import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from ..schemas import TokenData, UserLogin

# ── SECRET & JWT CONFIG ─────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── PASSWORD HELPERS ────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ── JWT HELPERS ─────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ── CURRENT USER DEPENDENCY ────────────────────────
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

# ── LOGIN REQUIREMENT FOR EVALUATORS ───────────────
async def require_evaluator(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "evaluator":
        raise HTTPException(status_code=403, detail="Evaluator access required")
    return current_user

# ── LOGIN ROUTER ───────────────────────────────────
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Logs in a user (Evaluator / Admin / Super Admin)
    Returns JWT access token and role
    """
    user = db.query(User).filter(User.svc_no == data.svc_no).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.svc_no})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "svc_no": user.svc_no
    }

# ── GET CURRENT USER ───────────────────────────────
@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user info
    """
    return {
        "svc_no": current_user.svc_no,
        "full_name": current_user.full_name,
        "rank": current_user.rank,
        "role": current_user.role,
        "email": current_user.email
    }