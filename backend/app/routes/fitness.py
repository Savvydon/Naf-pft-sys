from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from app.schemas import InputSchema, PFTUpdate
from app.services.database import get_db
from app.services.models import PFTResult, User
from app.services.auth import get_current_user, require_admin, require_evaluator
from app.services.naf_pft import compute_naf_pft

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
                "step_up_status": r.step_up_status,
                "step_up_points": r.step_up_points,
                "push_up_value": r.push_up_value,
                "push_up_ideal": r.push_up_ideal,
                "push_up_status": r.push_up_status,
                "push_up_points": r.push_up_points,
                "sit_up_value": r.sit_up_value,
                "sit_up_ideal": r.sit_up_ideal,
                "sit_up_status": r.sit_up_status,
                "sit_up_points": r.sit_up_points,
                "chin_up_value": r.chin_up_value,
                "chin_up_ideal": r.chin_up_ideal,
                "chin_up_status": r.chin_up_status,
                "chin_up_points": r.chin_up_points,
                "sit_reach_value": r.sit_reach_value,
                "sit_reach_ideal": r.sit_reach_ideal,
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


# UPDATE RESULT - ADMIN ONLY
@router.put("/pft-results/{result_id}", response_model=dict)
async def update_pft_result(
    result_id: int,
    update_data: PFTUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Update PFT result and recompute derived values"""
    stmt = select(PFTResult).where(PFTResult.id == result_id)
    record = db.execute(stmt).scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="PFT result not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Prevent changing evaluator info via update
    update_dict.pop('evaluator_name', None)
    update_dict.pop('evaluator_rank', None)
    
    # Apply the raw updates first
    for key, value in update_dict.items():
        if hasattr(record, key):
            setattr(record, key, value)
    
    # Check if any computation-relevant fields were changed
    computation_fields = {
        'age', 'sex', 'height', 'weight', 'cardio_cage', 
        'step_up', 'push_up', 'sit_up', 'chin_up', 'sit_reach'
    }
    
    if computation_fields.intersection(update_dict.keys()):
        # Build input data for computation from updated record
        compute_input = {
            'year': record.year,
            'full_name': record.full_name,
            'rank': record.rank,
            'svc_no': record.svc_no,
            'unit': record.unit,
            'appointment': record.appointment,
            'email': record.email,
            'date': record.date,
            'age': record.age,
            'sex': record.sex,
            'height': record.height,
            'weight': record.weight_current,
            'cardio_cage': record.cardio_cage,
            'step_up': record.step_up_value,
            'push_up': record.push_up_value,
            'sit_up': record.sit_up_value,
            'chin_up': record.chin_up_value,
            'sit_reach': record.sit_reach_value,
            'evaluator_name': record.evaluator_name,
            'evaluator_rank': record.evaluator_rank,
        }
        
        # Re-run the computation
        new_result = compute_naf_pft(compute_input)
        
        if "error" in new_result:
            raise HTTPException(400, f"Computation error: {new_result['error']}")
        
        # Update all computed fields in the record
        computed_mappings = {
            'weight_ideal': new_result['weight_ideal'],
            'weight_excess': new_result['weight_excess'],
            'weight_deficit': new_result['weight_deficit'],
            'weight_status': new_result['weight_status'],
            'bmi_current': new_result['bmi_current'],
            'bmi_ideal': new_result['bmi_ideal'],
            'bmi_excess': new_result['bmi_excess'],
            'bmi_deficit': new_result['bmi_deficit'],
            'bmi_status': new_result['bmi_status'],
            'bmi_points': new_result['bmi_points'],
            'cardio_type': new_result['cardio_type'],
            'cardio_value': new_result['cardio_value'],
            'cardio_ideal': new_result['cardio_ideal'],
            'cardio_status': new_result['cardio_status'],
            'cardio_points': new_result['cardio_points'],
            'step_up_value': new_result['step_up_value'],
            'step_up_ideal': new_result['step_up_ideal'],
            'step_up_status': new_result['step_up_status'],
            'step_up_points': new_result['step_up_points'],
            'push_up_value': new_result['push_up_value'],
            'push_up_ideal': new_result['push_up_ideal'],
            'push_up_status': new_result['push_up_status'],
            'push_up_points': new_result['push_up_points'],
            'sit_up_value': new_result['sit_up_value'],
            'sit_up_ideal': new_result['sit_up_ideal'],
            'sit_up_status': new_result['sit_up_status'],
            'sit_up_points': new_result['sit_up_points'],
            'chin_up_value': new_result['chin_up_value'],
            'chin_up_ideal': new_result['chin_up_ideal'],
            'chin_up_status': new_result['chin_up_status'],
            'chin_up_points': new_result['chin_up_points'],
            'sit_reach_value': new_result['sit_reach_value'],
            'sit_reach_ideal': new_result['sit_reach_ideal'],
            'sit_reach_status': new_result['sit_reach_status'],
            'sit_reach_points': new_result['sit_reach_points'],
            'aggregate': new_result['aggregate'],
            'grade': new_result['grade'],
            'prescription_duration': new_result['prescription_duration'],
            'prescription_days': new_result['prescription_days'],
            'recommended_activity': new_result['recommended_activity'],
        }
        
        for key, value in computed_mappings.items():
            if hasattr(record, key):
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
        "recomputed": bool(computation_fields.intersection(update_dict.keys())),
        "message": "PFT result updated and recomputed successfully",
    }


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

# # backend/app/routes/fitness.py
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import select
# from typing import List

# from app.schemas import InputSchema, PFTUpdate
# from app.services.database import get_db
# from app.services.models import PFTResult, User
# from app.services.auth import get_current_user, require_admin, require_evaluator

# # Import the new utilities for recomputation
# from app.services.pft_utils import recompute_pft_from_record, apply_computed_fields_to_record

# router = APIRouter(prefix="/api", tags=["PFT Results"])


# # GET ALL RESULTS - ADMIN ONLY
# @router.get("/pft-results", response_model=List[dict])
# async def get_all_pft_results(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Admin/SuperAdmin only: Get all PFT results"""
#     try:
#         stmt = select(PFTResult).order_by(PFTResult.created_at.desc())
#         records = db.execute(stmt).scalars().all()

#         return [
#             {
#                 "id": r.id,
#                 "year": r.year,
#                 "svc_no": r.svc_no,
#                 "full_name": r.full_name,
#                 "rank": r.rank,
#                 "unit": r.unit,
#                 "appointment": r.appointment,
#                 "age": r.age,
#                 "sex": r.sex,
#                 "email": r.email,
#                 "date": r.date,
#                 "height": r.height,
#                 "weight_current": r.weight_current,
#                 "weight_ideal": r.weight_ideal,
#                 "weight_excess": r.weight_excess,
#                 "weight_deficit": r.weight_deficit,
#                 "weight_status": r.weight_status,
#                 "bmi_current": r.bmi_current,
#                 "bmi_status": r.bmi_status,
#                 "bmi_ideal": r.bmi_ideal,
#                 "bmi_excess": r.bmi_excess,
#                 "bmi_deficit": r.bmi_deficit,
#                 "bmi_points": r.bmi_points,
#                 "cardio_cage": r.cardio_cage,
#                 "cardio_type": r.cardio_type,
#                 "cardio_value": r.cardio_value,
#                 "cardio_ideal": r.cardio_ideal,
#                 "cardio_status": r.cardio_status,
#                 "cardio_points": r.cardio_points,
#                 "step_up_value": r.step_up_value,
#                 "step_up_ideal": r.step_up_ideal,
#                 "step_up_status": r.step_up_status,
#                 "step_up_points": r.step_up_points,
#                 "push_up_value": r.push_up_value,
#                 "push_up_ideal": r.push_up_ideal,
#                 "push_up_status": r.push_up_status,
#                 "push_up_points": r.push_up_points,
#                 "sit_up_value": r.sit_up_value,
#                 "sit_up_ideal": r.sit_up_ideal,
#                 "sit_up_status": r.sit_up_status,
#                 "sit_up_points": r.sit_up_points,
#                 "chin_up_value": r.chin_up_value,
#                 "chin_up_ideal": r.chin_up_ideal,
#                 "chin_up_status": r.chin_up_status,
#                 "chin_up_points": r.chin_up_points,
#                 "sit_reach_value": r.sit_reach_value,
#                 "sit_reach_ideal": r.sit_reach_ideal,
#                 "sit_reach_status": r.sit_reach_status,
#                 "sit_reach_points": r.sit_reach_points,
#                 "aggregate": r.aggregate,
#                 "grade": r.grade,
#                 "prescription_duration": r.prescription_duration,
#                 "prescription_days": r.prescription_days,
#                 "recommended_activity": r.recommended_activity,
#                 "evaluator_name": r.evaluator_name,
#                 "evaluator_rank": r.evaluator_rank,
#                 "created_at": r.created_at.isoformat() if r.created_at else None,
#                 "notes": r.notes,
#             }
#             for r in records
#         ]

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # GET RESULT BY ID - ADMIN ONLY
# @router.get("/pft-results/{result_id}", response_model=dict)
# async def get_pft_result_by_id(
#     result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Admin/SuperAdmin only: Get specific PFT result"""
#     stmt = select(PFTResult).where(PFTResult.id == result_id)
#     record = db.execute(stmt).scalars().first()

#     if not record:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"PFT result with ID {result_id} not found"
#         )

#     result_dict = {
#         c.name: getattr(record, c.name)
#         for c in record.__table__.columns
#     }
#     if result_dict.get('created_at'):
#         result_dict['created_at'] = result_dict['created_at'].isoformat()
#     if result_dict.get('updated_at'):
#         result_dict['updated_at'] = result_dict['updated_at'].isoformat()

#     return result_dict


# # GET RESULTS BY SERVICE NUMBER - ADMIN ONLY
# @router.get("/pft-results/svc/{svc_no}", response_model=List[dict])
# async def get_pft_results_by_svc_no(
#     svc_no: str,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Admin/SuperAdmin only: Search by service number"""
#     stmt = (
#         select(PFTResult)
#         .where(PFTResult.svc_no == svc_no.upper())
#         .order_by(PFTResult.created_at.desc())
#     )

#     records = db.execute(stmt).scalars().all()

#     if not records:
#         raise HTTPException(
#             status_code=404,
#             detail=f"No PFT results found for service number {svc_no}"
#         )

#     return [
#         {
#             "id": r.id,
#             "year": r.year,
#             "full_name": r.full_name,
#             "rank": r.rank,
#             "unit": r.unit,
#             "age": r.age,
#             "sex": r.sex,
#             "aggregate": float(r.aggregate) if r.aggregate else None,
#             "grade": r.grade,
#             "created_at": r.created_at.isoformat() if r.created_at else None,
#             "evaluator_name": r.evaluator_name,
#             "evaluator_rank": r.evaluator_rank,
#         }
#         for r in records
#     ]


# # UPDATE RESULT - ADMIN ONLY (WITH RECOMPUTATION)
# @router.put("/pft-results/{result_id}", response_model=dict)
# async def update_pft_result(
#     result_id: int,
#     update_data: PFTUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Admin only: Update PFT result and recompute all derived scores"""
#     stmt = select(PFTResult).where(PFTResult.id == result_id)
#     record = db.execute(stmt).scalars().first()

#     if not record:
#         raise HTTPException(status_code=404, detail="PFT result not found")

#     # 1. Apply only the fields the admin actually sent
#     update_dict = update_data.model_dump(exclude_unset=True)

#     # Protect evaluator info from being overwritten
#     update_dict.pop('evaluator_name', None)
#     update_dict.pop('evaluator_rank', None)

#     updated_fields = []
#     for key, value in update_dict.items():
#         if hasattr(record, key):
#             setattr(record, key, value)
#             updated_fields.append(key)

#     # 2. Recompute all derived fields based on current (updated) record values
#     try:
#         recomputed = recompute_pft_from_record(record)
#         apply_computed_fields_to_record(record, recomputed)

#         db.commit()
#         db.refresh(record)

#     except ValueError as ve:
#         db.rollback()
#         raise HTTPException(status_code=400, detail=str(ve))
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to recompute and save updated PFT: {str(e)}"
#         )

#     # 3. Return confirmation with some key updated values
#     return {
#         "id": record.id,
#         "svc_no": record.svc_no,
#         "full_name": record.full_name,
#         "year": record.year,
#         "message": "PFT result updated and all scores recomputed successfully",
#         "updated_input_fields": updated_fields,
#         "new_height": record.height,
#         "new_weight": record.weight_current,
#         "new_bmi": record.bmi_current,
#         "new_aggregate": record.aggregate,
#         "new_grade": record.grade,
#     }


# # DELETE RESULT - ADMIN ONLY
# @router.delete("/pft-results/{result_id}")
# async def delete_pft_result(
#     result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Admin only: Delete PFT result"""
#     stmt = select(PFTResult).where(PFTResult.id == result_id)
#     record = db.execute(stmt).scalars().first()

#     if not record:
#         raise HTTPException(status_code=404, detail="PFT result not found")

#     db.delete(record)
#     db.commit()
#     return {"message": f"PFT result {result_id} deleted successfully"}


# # COMPUTE NEW PFT - EVALUATOR ONLY
# # (This endpoint was in main.py earlier — moved here for better organization if desired)
# @router.post("/compute")
# def compute_pft(
#     data: InputSchema,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_evaluator)
# ):
#     """Evaluators only: Compute and save new PFT results"""
#     if not (2000 <= data.year <= 2100):
#         raise HTTPException(422, "Year must be between 2000 and 2100")

#     data_dict = data.model_dump()
#     svc_no = data_dict.get("svc_no", "").strip()

#     if "/" in svc_no:
#         svc_no = "/".join(part.strip() for part in svc_no.split("/"))
#     if not svc_no.startswith("NAF"):
#         svc_no = "NAF/" + svc_no.lstrip("/")

#     data_dict["svc_no"] = svc_no
#     data_dict["evaluator_name"] = current_user.full_name
#     data_dict["evaluator_rank"] = current_user.rank

#     from app.services.naf_pft import compute_naf_pft   # assuming this is where compute_naf_pft lives

#     result = compute_naf_pft(data_dict)

#     if "error" in result:
#         raise HTTPException(400, result["error"])

#     db_data = {
#         k: v
#         for k, v in result.items()
#         if hasattr(PFTResult, k) and v is not None
#     }

#     try:
#         db_result = PFTResult(**db_data)
#         db.add(db_result)
#         db.commit()
#         db.refresh(db_result)

#         return {
#             **result,
#             "id": db_result.id,
#             "evaluator_name": db_result.evaluator_name,
#             "evaluator_rank": db_result.evaluator_rank,
#             "message": "PFT result computed and saved successfully",
#         }

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(500, f"Database save failed: {str(e)}")
