from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import FitnessInput
from app.services.naf_pft import compute_naf_pft
from pydantic import BaseModel

from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List, Optional
from ..services.database import get_db
from ..services.models import PFTResult

router = APIRouter(prefix="/api", tags=["PFT Results"])

# @router.post("/compute")
# def compute_fitness(data: FitnessInput):
#     return compute_naf_pft(data)

@router.get("/pft-results", response_model=List[dict])
async def get_all_pft_results(db: Session = Depends(get_db)):
    try:
        stmt = select(PFTResult).order_by(PFTResult.created_at.desc())
        result = db.execute(stmt)
        records = result.scalars().all()

        return [
            {
                "id": r.id,
                "svc_no": r.svc_no,
                "full_name": r.full_name,
                "rank": r.rank,
                "unit": r.unit,
                "appointment": r.appointment,
                "age": r.age,
                "sex": r.sex,
                "height": r.height,
                "weight_current": r.weight_current,
                "bmi_current": r.bmi_current,
                "bmi_status": r.bmi_status,
                "cardio_cage": r.cardio_cage,
                "step_up_value": r.step_up_value,
                "push_up_value": r.push_up_value,
                "sit_up_value": r.sit_up_value,
                "chin_up_value": r.chin_up_value,
                "sit_reach_value": r.sit_reach_value,
                "aggregate": r.aggregate,
                "grade": r.grade,
                "prescription_duration": r.prescription_duration,
                "prescription_days": r.prescription_days,
                "recommended_activity": r.recommended_activity,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            
            }
            for r in records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/pft-results/{result_id}", response_model=dict)
async def get_pft_result_by_id(
    result_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single PFT result by its database ID
    """
    stmt = select(PFTResult).where(PFTResult.id == result_id)
    result = db.execute(stmt)
    record = result.scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PFT result with ID {result_id} not found"
        )

    
    return {
        "id": record.id,
        "svc_no": record.svc_no,
        "full_name": record.full_name,
        "rank": record.rank,
        "unit": record.unit,
        "appointment": record.appointment,
        "age": record.age,
        "sex": record.sex,
        "height": record.height,
        "weight_current": record.weight_current,
        "bmi_current": record.bmi_current,
        "bmi_status": record.bmi_status,
        "cardio_cage": record.cardio_cage,
        "step_up_value": record.step_up_value,
        "push_up_value": record.push_up_value,
        "sit_up_value": record.sit_up_value,
        "chin_up_value": record.chin_up_value,
        "sit_reach_value": record.sit_reach_value,
        "aggregate": record.aggregate,
        "grade": record.grade,
        "prescription_duration": record.prescription_duration,
        "prescription_days": record.prescription_days,
        "recommended_activity": record.recommended_activity,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }



@router.get("/pft-results/svc/{svc_no}", response_model=list[dict])
async def get_pft_results_by_svc_no(
    svc_no: str,
    db: Session = Depends(get_db)
):
    """
    Get all PFT results for a specific service number
    """
    stmt = (
        select(PFTResult)
        .where(PFTResult.svc_no == svc_no)
        .order_by(PFTResult.created_at.desc())
    )
    result = db.execute(stmt)
    records = result.scalars().all()

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No PFT results found for service number {svc_no}"
        )

    return [
        {
            "id": r.id,
            "full_name": r.full_name,
            "rank": r.rank,
            "unit": r.unit,
            "age": r.age,
            "sex": r.sex,
            "aggregate": float(r.aggregate) if r.aggregate else None,
            "grade": r.grade,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            
        }
        for r in records
    ]


class PFTUpdate(BaseModel):
    
    evaluator_name: Optional[str] = None
    evaluator_rank: Optional[str] = None
    grade: Optional[str] = None
    notes: Optional[str] = None  

@router.put("/pft-results/{result_id}", response_model=dict)
async def update_pft_result(
    result_id: int,
    update_data: PFTUpdate,
    db: Session = Depends(get_db)
):
    """
    Update selected fields of an existing PFT result
    """
    stmt = select(PFTResult).where(PFTResult.id == result_id)
    result = db.execute(stmt)
    record = result.scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PFT result with ID {result_id} not found"
        )

    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "svc_no": record.svc_no,
        "full_name": record.full_name,
        "rank": record.rank,
        "unit": record.unit,
        "appointment": record.appointment,
        "age": record.age,
        "sex": record.sex,
        "height": record.height,
        "weight_current": record.weight_current,
        "bmi_current": record.bmi_current,
        "bmi_status": record.bmi_status,
        "cardio_cage": record.cardio_cage,
        "step_up_value": record.step_up_value,
        "push_up_value": record.push_up_value,
        "sit_up_value": record.sit_up_value,
        "chin_up_value": record.chin_up_value,
        "sit_reach_value": record.sit_reach_value,
        "aggregate": record.aggregate,
        "grade": record.grade,
        "prescription_duration": record.prescription_duration,
        "prescription_days": record.prescription_days,
        "recommended_activity": record.recommended_activity,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_fields": list(update_dict.keys()),
        "message": "PFT result updated successfully"
    }