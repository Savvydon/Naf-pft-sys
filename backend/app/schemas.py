# backend/app/schemas.py
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
    sit_reach: int      
    evaluator_name: str
    evaluator_rank: str


class PFTUpdate(BaseModel):
    # Fields allowed to be updated (all optional)
    year: Optional[int] = None
    full_name: Optional[str] = None
    rank: Optional[str] = None
    svc_no: Optional[str] = None
    unit: Optional[str] = None
    appointment: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    email: Optional[str] = None
    date: Optional[str] = None
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