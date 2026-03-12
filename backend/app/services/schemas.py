# # app/schemas.py
# from pydantic import BaseModel
# from typing import Optional

# class InputSchema(BaseModel):
#     year: int
#     full_name: str
#     rank: str
#     svc_no: str
#     unit: str
#     email: str
#     appointment: str
#     age: int
#     sex: str
#     date: str
#     height: float
#     weight: float
#     cardio_cage: int
#     step_up: int
#     push_up: int
#     sit_up: int
#     chin_up: int
#     sit_reach: float
#     evaluator_name: str
#     evaluator_rank: str

from pydantic import BaseModel
from typing import Optional

class InputSchema(BaseModel):
    year: int
    full_name: str
    rank: str
    svc_no: str
    unit: str
    email: str
    appointment: str
    age: int
    sex: str
    date: str
    height: float
    weight: float
    cardio_cage: int
    step_up: int
    push_up: int
    sit_up: int
    chin_up: int
    sit_reach: float

    # evaluator_name and evaluator_rank removed from schema
    # → backend will set them from authenticated user


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    svc_no: Optional[str] = None


class UserLogin(BaseModel):
    svc_no: str
    password: str


class UserOut(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    role: str
    email: Optional[str] = None