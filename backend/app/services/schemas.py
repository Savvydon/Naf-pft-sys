from pydantic import BaseModel
from typing import Optional

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

    sit_reach: float

    # evaluator_name and evaluator_rank intentionally excluded
    # backend automatically attaches them from authenticated user


# AUTHENTICATION SCHEMAS

class Token(BaseModel):

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):

    svc_no: Optional[str] = None


# LOGIN SCHEMA
class UserLogin(BaseModel):

    svc_no: str
    password: str
    rank: str


# USER RESPONSE SCHEMA
class UserOut(BaseModel):

    svc_no: str
    full_name: str
    rank: str
    role: str
    email: Optional[str] = None