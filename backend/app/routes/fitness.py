from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.schemas import InputSchema, PFTUpdate
from app.services.database import get_db
from app.services.models import PFTResult, User
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["PFT Results"])


# ─────────────────────────────────────────────
# GET ALL RESULTS (LOGIN REQUIRED)
# ─────────────────────────────────────────────
@router.get("/pft-results", response_model=List[dict])
async def get_all_pft_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        stmt = select(PFTResult).order_by(PFTResult.created_at.desc())
        records = db.execute(stmt).scalars().all()

        return [
            {
                "id": r.id,
                "year": r.year,
                "svc_no": r.svc_no,
                "full_name": r.full_name,
                "rank": r.rank,
                "unit": r.unit,
                "appointment": r.appointment,
                "age": r.age,
                "sex": r.sex,
                "email": r.email,
                "date": r.date,
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

                "weight_ideal": r.weight_ideal,
                "weight_excess": r.weight_excess,
                "weight_deficit": r.weight_deficit,
                "weight_status": r.weight_status,

                "bmi_ideal": r.bmi_ideal,
                "bmi_excess": r.bmi_excess,
                "bmi_deficit": r.bmi_deficit,
                "bmi_points": r.bmi_points,

                "cardio_type": r.cardio_type,
                "cardio_value": r.cardio_value,
                "cardio_ideal": r.cardio_ideal,
                "cardio_status": r.cardio_status,
                "cardio_points": r.cardio_points,

                "step_up_ideal": r.step_up_ideal,
                "step_up_status": r.step_up_status,
                "step_up_points": r.step_up_points,

                "push_up_ideal": r.push_up_ideal,
                "push_up_status": r.push_up_status,
                "push_up_points": r.push_up_points,

                "sit_up_ideal": r.sit_up_ideal,
                "sit_up_status": r.sit_up_status,
                "sit_up_points": r.sit_up_points,

                "chin_up_ideal": r.chin_up_ideal,
                "chin_up_status": r.chin_up_status,
                "chin_up_points": r.chin_up_points,

                "sit_reach_ideal": r.sit_reach_ideal,
                "sit_reach_status": r.sit_reach_status,
                "sit_reach_points": r.sit_reach_points,

                "evaluator_name": r.evaluator_name,
                "evaluator_rank": r.evaluator_rank,

                "created_at": r.created_at.isoformat() if r.created_at else None,
                "notes": r.notes,
            }
            for r in records
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET RESULT BY ID
# ─────────────────────────────────────────────
@router.get("/pft-results/{result_id}", response_model=dict)
async def get_pft_result_by_id(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PFT result with ID {result_id} not found"
        )

    return record.__dict__


# ─────────────────────────────────────────────
# GET RESULTS BY SERVICE NUMBER
# ─────────────────────────────────────────────
@router.get("/pft-results/svc/{svc_no}", response_model=List[dict])
async def get_pft_results_by_svc_no(
    svc_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    stmt = (
        select(PFTResult)
        .where(PFTResult.svc_no == svc_no)
        .order_by(PFTResult.created_at.desc())
    )

    records = db.execute(stmt).scalars().all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No PFT results found for service number {svc_no}"
        )

    return [
        {
            "id": r.id,
            "year": r.year,
            "full_name": r.full_name,
            "rank": r.rank,
            "unit": r.unit,
            "age": r.age,
            "sex": r.sex,
            "aggregate": float(r.aggregate) if r.aggregate else None,
            "grade": r.grade,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "evaluator_name": r.evaluator_name,
            "evaluator_rank": r.evaluator_rank,
        }
        for r in records
    ]


# ─────────────────────────────────────────────
# UPDATE RESULT (ADMIN ONLY)
# ─────────────────────────────────────────────
@router.put("/pft-results/{result_id}", response_model=dict)
async def update_pft_result(
    result_id: int,
    update_data: PFTUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="PFT result not found")

    update_dict = update_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "year": record.year,
        "svc_no": record.svc_no,
        "full_name": record.full_name,
        "rank": record.rank,
        "updated_fields": list(update_dict.keys()),
        "message": "PFT result updated successfully",
    }


# ─────────────────────────────────────────────
# DELETE RESULT (ADMIN ONLY)
# ─────────────────────────────────────────────
@router.delete("/pft-results/{result_id}")
async def delete_pft_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="PFT result not found")

    db.delete(record)
    db.commit()

    return {"message": f"PFT result {result_id} deleted successfully"}
