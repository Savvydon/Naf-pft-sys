# backend/app/schemas.py

from pydantic import BaseModel
from typing import Optional


# ────────────────────────────────────────────
# PFT INPUT SCHEMA (Evaluator Form Submission)
class InputSchema(BaseModel):

    year: int
    full_name: str
    rank: str
    svc_no: str
    unit: str
    email: str
    appointment: str
    date: str
    age: int
    sex: str
    height: float
    weight: float
    cardio_cage: int
    step_up: int
    push_up: int
    sit_up: int
    chin_up: int
    sit_reach: int

    # evaluator_name and evaluator_rank intentionally excluded
    # backend automatically attaches them from authenticated user


# ADMIN UPDATE SCHEMA
# (All fields optional so admin can modify any part)
class PFTUpdate(BaseModel):

    year: Optional[int] = None
    full_name: Optional[str] = None
    rank: Optional[str] = None
    svc_no: Optional[str] = None
    unit: Optional[str] = None
    email: Optional[str] = None
    appointment: Optional[str] = None
    date: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    cardio_cage: Optional[int] = None
    step_up: Optional[int] = None
    push_up: Optional[int] = None
    sit_up: Optional[int] = None
    chin_up: Optional[int] = None
    sit_reach: Optional[int] = None
    evaluator_name: Optional[str] = None
    evaluator_rank: Optional[str] = None
    notes: Optional[str] = None


# AUTHENTICATION SCHEMAS
class Token(BaseModel):

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):

    svc_no: Optional[str] = None


# LOGIN SCHEMA
class UserLogin(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str


# USER RESPONSE SCHEMA
class UserOut(BaseModel):

    svc_no: str
    full_name: str
    rank: str
    role: str
    email: Optional[str] = None
