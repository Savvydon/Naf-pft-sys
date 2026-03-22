import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Session as UserSession
from ..schemas import TokenData
import uuid

# SECRET & JWT CONFIG
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# PASSWORD HELPERS
def _truncate_password(password: str) -> str:
    """
    bcrypt only supports passwords up to 72 bytes.
    This safely truncates the password to avoid bcrypt errors.
    """
    return password.encode("utf-8")[:72].decode("utf-8", "ignore")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hashed value.
    """
    safe_password = _truncate_password(plain_password)
    return pwd_context.verify(safe_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash password safely with bcrypt.
    """
    safe_password = _truncate_password(password)
    return pwd_context.hash(safe_password)

# JWT TOKEN CREATION
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


# SESSION MANAGEMENT
def create_session(db: Session, user: User, token: str) -> UserSession:
    """Create a new session in the database"""
    # Invalidate old sessions for this user
    db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).update({"is_active": False})
    
    # Create new session
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        is_active=True
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def validate_session(db: Session, token: str) -> Optional[User]:
    """Validate session token and return user"""
    if not token:
        return None
        
    session = db.query(UserSession).filter(
        UserSession.token == token,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not session:
        return None
    
    # Update last activity
    session.last_activity = datetime.now(timezone.utc)
    db.commit()
    
    return session.user

def invalidate_session(db: Session, token: str):
    """Invalidate a session"""
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if session:
        session.is_active = False
        db.commit()

def invalidate_all_user_sessions(db: Session, user_id: int):
    """Invalidate all sessions for a user"""
    db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True
    ).update({"is_active": False})
    db.commit()


# GET CURRENT USER - Supports both Header and Cookie
async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from Authorization header first
    auth_token = token
    
    # If no header token, try cookie
    if not auth_token:
        auth_token = request.cookies.get("pft_session")
    
    if not auth_token:
        raise credentials_exception
    
    # First validate JWT
    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
        svc_no: str = payload.get("sub")

        if svc_no is None:
            raise credentials_exception
        token_data = TokenData(svc_no=svc_no)
    except JWTError:
        raise credentials_exception
    
    # Then validate session in database
    user = validate_session(db, auth_token)
    
    if user is None:
        raise credentials_exception
        
    # Verify svc_no matches
    if user.svc_no != token_data.svc_no:
        raise credentials_exception

    return user

# ROLE PROTECTION - ALL AUTHENTICATED USERS CAN EVALUATE
async def require_evaluator(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    ALL authenticated users can perform evaluations.
    This includes evaluators, admins, and super_admins.
    """
    # Any valid role can evaluate
    if current_user.role not in ["evaluator", "admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Valid user account required for evaluation"
        )
    return current_user

# ADMIN ACCESS (admin or super_admin only)
async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Requires admin or super_admin role.
    Evaluators cannot access admin endpoints.
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user

# SUPER ADMIN ONLY
async def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Requires super_admin role only.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        )
    return current_user

#===Old code====
# import os
# from datetime import datetime, timedelta, timezone
# from typing import Optional
# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from sqlalchemy.orm import Session
# from .database import get_db
# from .models import User
# from ..schemas import TokenData

# # SECRET & JWT CONFIG
# SECRET_KEY = os.getenv("SECRET_KEY")

# if not SECRET_KEY:
#     raise ValueError("SECRET_KEY environment variable is not set")

# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# # PASSWORD HELPERS
# def _truncate_password(password: str) -> str:
#     """
#     bcrypt only supports passwords up to 72 bytes.
#     This safely truncates the password to avoid bcrypt errors.
#     """
#     return password.encode("utf-8")[:72].decode("utf-8", "ignore")


# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """
#     Verify a password against its hashed value.
#     """
#     safe_password = _truncate_password(plain_password)
#     return pwd_context.verify(safe_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     """
#     Hash password safely with bcrypt.
#     """
#     safe_password = _truncate_password(password)
#     return pwd_context.hash(safe_password)

# # JWT TOKEN CREATION
# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()

#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(
#             minutes=ACCESS_TOKEN_EXPIRE_MINUTES
#         )

#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt


# # GET CURRENT USER
# async def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db)
# ) -> User:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         svc_no: str = payload.get("sub")

#         if svc_no is None:
#             raise credentials_exception
#         token_data = TokenData(svc_no=svc_no)
#     except JWTError:
#         raise credentials_exception
    
#     user = db.query(User).filter(User.svc_no == token_data.svc_no).first()

#     if user is None:
#         raise credentials_exception

#     return user

# # ROLE PROTECTION - ALL AUTHENTICATED USERS CAN EVALUATE
# async def require_evaluator(
#     current_user: User = Depends(get_current_user)
# ) -> User:
#     """
#     ALL authenticated users can perform evaluations.
#     This includes evaluators, admins, and super_admins.
#     """
#     # Any valid role can evaluate
#     if current_user.role not in ["evaluator", "admin", "super_admin"]:
#         raise HTTPException(
#             status_code=403,
#             detail="Valid user account required for evaluation"
#         )
#     return current_user

# # ADMIN ACCESS (admin or super_admin only)
# async def require_admin(
#     current_user: User = Depends(get_current_user)
# ) -> User:
#     """
#     Requires admin or super_admin role.
#     Evaluators cannot access admin endpoints.
#     """
#     if current_user.role not in ["admin", "super_admin"]:
#         raise HTTPException(
#             status_code=403,
#             detail="Admin access required"
#         )
#     return current_user

# # SUPER ADMIN ONLY
# async def require_super_admin(
#     current_user: User = Depends(get_current_user)
# ) -> User:
#     """
#     Requires super_admin role only.
#     """
#     if current_user.role != "super_admin":
#         raise HTTPException(
#             status_code=403,
#             detail="Super admin access required"
#         )
#     return current_user