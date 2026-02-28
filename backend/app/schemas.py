from pydantic import BaseModel

class FitnessInput(BaseModel):
    year: int
    full_name: str
    rank: str
    svc_no: str
    unit: str
    date: str
    appointment: str
    age: int
    sex: str
    email: str
    height: float
    weight: float
    cardio_minutes: int
    cardio_seconds: int
    step_up: int
    push_up: int
    sit_up: int
    chin_up: int
    sit_reach: int
    evaluator_name: str
    evaluator_rank: str
