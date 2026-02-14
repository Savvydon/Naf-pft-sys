from fastapi import APIRouter
from app.schemas import FitnessInput
from app.services.naf_pft import compute_naf_pft

router = APIRouter(prefix="/api")

@router.post("/compute")
def compute_fitness(data: FitnessInput):
    return compute_naf_pft(data)
