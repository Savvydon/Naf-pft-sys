# backend/app/routes/fitness.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.schemas import InputSchema, PFTUpdate
from app.services.database import get_db
from app.services.models import PFTResult, User
from app.services.auth import get_current_user, require_admin, require_evaluator

# Import the new utilities for recomputation
from app.services.pft_utils import recompute_pft_from_record, apply_computed_fields_to_record

router = APIRouter(prefix="/api", tags=["PFT Results"])


# GET ALL RESULTS - ADMIN ONLY
@router.get("/pft-results", response_model=List[dict])
async def get_all_pft_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin/SuperAdmin only: Get all PFT results"""
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
                "weight_ideal": r.weight_ideal,
                "weight_excess": r.weight_excess,
                "weight_deficit": r.weight_deficit,
                "weight_status": r.weight_status,
                "bmi_current": r.bmi_current,
                "bmi_status": r.bmi_status,
                "bmi_ideal": r.bmi_ideal,
                "bmi_excess": r.bmi_excess,
                "bmi_deficit": r.bmi_deficit,
                "bmi_points": r.bmi_points,
                "cardio_cage": r.cardio_cage,
                "cardio_type": r.cardio_type,
                "cardio_value": r.cardio_value,
                "cardio_ideal": r.cardio_ideal,
                "cardio_status": r.cardio_status,
                "cardio_points": r.cardio_points,
                "step_up_value": r.step_up_value,
                "step_up_ideal": r.step_up_ideal,
                "step_up_deficit": r.step_up_deficit,
                "step_up_excess": r.step_up_excess,
                "step_up_status": r.step_up_status,
                "step_up_points": r.step_up_points,
                "push_up_value": r.push_up_value,
                "push_up_ideal": r.push_up_ideal,
                "push_up_deficit": r.push_up_deficit,
                "push_up_excess": r.push_up_excess,
                "push_up_status": r.push_up_status,
                "push_up_points": r.push_up_points,
                "sit_up_value": r.sit_up_value,
                "sit_up_ideal": r.sit_up_ideal,
                "sit_up_deficit": r.sit_up_deficit,
                "sit_up_excess": r.sit_up_excess,
                "sit_up_status": r.sit_up_status,
                "sit_up_points": r.sit_up_points,
                "chin_up_value": r.chin_up_value,
                "chin_up_ideal": r.chin_up_ideal,
                "chin_up_deficit": r.chin_up_deficit,
                "chin_up_excess": r.chin_up_excess,
                "chin_up_status": r.chin_up_status,
                "chin_up_points": r.chin_up_points,
                "sit_reach_value": r.sit_reach_value,
                "sit_reach_ideal": r.sit_reach_ideal,
                "sit_reach_deficit": r.sit_reach_deficit,
                "sit_reach_excess": r.sit_reach_excess,
                "sit_reach_status": r.sit_reach_status,
                "sit_reach_points": r.sit_reach_points,
                "aggregate": r.aggregate,
                "grade": r.grade,
                "prescription_duration": r.prescription_duration,
                "prescription_days": r.prescription_days,
                "recommended_activity": r.recommended_activity,
                "evaluator_name": r.evaluator_name,
                "evaluator_rank": r.evaluator_rank,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "notes": r.notes,
            }
            for r in records
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# GET RESULT BY ID - ADMIN ONLY
@router.get("/pft-results/{result_id}", response_model=dict)
async def get_pft_result_by_id(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin/SuperAdmin only: Get specific PFT result"""
    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PFT result with ID {result_id} not found"
        )

    result_dict = {
        c.name: getattr(record, c.name)
        for c in record.__table__.columns
    }
    if result_dict.get('created_at'):
        result_dict['created_at'] = result_dict['created_at'].isoformat()
    if result_dict.get('updated_at'):
        result_dict['updated_at'] = result_dict['updated_at'].isoformat()

    return result_dict


# GET RESULTS BY SERVICE NUMBER - ADMIN ONLY
@router.get("/pft-results/svc/{svc_no}", response_model=List[dict])
async def get_pft_results_by_svc_no(
    svc_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin/SuperAdmin only: Search by service number"""
    stmt = (
        select(PFTResult)
        .where(PFTResult.svc_no == svc_no.upper())
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


# UPDATE RESULT - ADMIN ONLY (WITH RECOMPUTATION)
@router.put("/pft-results/{result_id}", response_model=dict)
async def update_pft_result(
    result_id: int,
    update_data: PFTUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Update PFT result and recompute all derived scores"""
    # Get the record with a lock to prevent concurrent modifications
    stmt = select(PFTResult).where(PFTResult.id == result_id).with_for_update()
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="PFT result not found")

    # 1. Apply only the fields the admin actually sent
    update_dict = update_data.model_dump(exclude_unset=True)

    # Protect evaluator info from being overwritten
    update_dict.pop('evaluator_name', None)
    update_dict.pop('evaluator_rank', None)
    update_dict.pop('created_at', None)
    update_dict.pop('updated_at', None)
    update_dict.pop('id', None)

    # Track which fields were updated
    updated_fields = []
    for key, value in update_dict.items():
        if hasattr(record, key) and value is not None:
            # Convert types if necessary
            if key in ['year', 'age', 'cardio_cage', 'step_up_value', 'push_up_value', 'sit_up_value', 'chin_up_value']:
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    pass
            elif key in ['height', 'weight_current', 'sit_reach_value']:
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    pass
            
            setattr(record, key, value)
            updated_fields.append(key)

    # 2. Recompute all derived fields based on current (updated) record values
    try:
        # Ensure we have required fields for computation
        if record.sex and record.age and record.height and record.weight_current:
            recomputed = recompute_pft_from_record(record)
            apply_computed_fields_to_record(record, recomputed)
        else:
            print(f"[UPDATE] Skipping recomputation - missing required fields")

        # Explicitly commit the computation
        db.commit()
        
        # Refresh to get updated timestamps and ensure data is persisted
        db.refresh(record)

        print(f"[UPDATE] Successfully updated record {result_id}, fields: {updated_fields}")

    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        print(f"[UPDATE ERROR] Failed to update: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to recompute and save updated PFT: {str(e)}"
        )

    # 3. Return the full updated record with all fields
    result_dict = {}
    for c in record.__table__.columns:
        val = getattr(record, c.name)
        # Convert datetime objects to ISO format strings
        if hasattr(val, 'isoformat'):
            result_dict[c.name] = val.isoformat()
        else:
            result_dict[c.name] = val

    return result_dict


# DELETE RESULT - ADMIN ONLY
@router.delete("/pft-results/{result_id}")
async def delete_pft_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Delete PFT result"""
    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="PFT result not found")

    db.delete(record)
    db.commit()
    return {"message": f"PFT result {result_id} deleted successfully"}


# COMPUTE NEW PFT - EVALUATOR ONLY
@router.post("/compute")
def compute_pft(
    data: InputSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_evaluator)
):
    """Evaluators only: Compute and save new PFT results"""
    if not (2000 <= data.year <= 2100):
        raise HTTPException(422, "Year must be between 2000 and 2100")

    data_dict = data.model_dump()
    svc_no = data_dict.get("svc_no", "").strip()

    if "/" in svc_no:
        svc_no = "/".join(part.strip() for part in svc_no.split("/"))
    if not svc_no.startswith("NAF"):
        svc_no = "NAF/" + svc_no.lstrip("/")

    data_dict["svc_no"] = svc_no
    data_dict["evaluator_name"] = current_user.full_name
    data_dict["evaluator_rank"] = current_user.rank

    from app.services.naf_pft import compute_naf_pft

    result = compute_naf_pft(data_dict)

    if "error" in result:
        raise HTTPException(400, result["error"])

    db_data = {
        k: v
        for k, v in result.items()
        if hasattr(PFTResult, k) and v is not None
    }

    try:
        db_result = PFTResult(**db_data)
        db.add(db_result)
        db.commit()
        db.refresh(db_result)

        return {
            **result,
            "id": db_result.id,
            "evaluator_name": db_result.evaluator_name,
            "evaluator_rank": db_result.evaluator_rank,
            "message": "PFT result computed and saved successfully",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Database save failed: {str(e)}")

