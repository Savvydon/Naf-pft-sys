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
    evaluator_name: str
    evaluator_rank: str