# from fastapi import APIRouter, Depends, HTTPException, status
# from app.schemas import FitnessInput
# from app.services.naf_pft import compute_naf_pft
# from pydantic import BaseModel

# from sqlalchemy.orm import Session
# from sqlalchemy import select
# from typing import List, Optional
# from ..services.database import get_db
# from ..services.models import PFTResult

# router = APIRouter(prefix="/api", tags=["PFT Results"])

# # @router.post("/compute")
# # def compute_fitness(data: FitnessInput):
# #     return compute_naf_pft(data)

# @router.get("/pft-results", response_model=List[dict])
# async def get_all_pft_results(db: Session = Depends(get_db)):
#     try:
#         stmt = select(PFTResult).order_by(PFTResult.created_at.desc())
#         result = db.execute(stmt)
#         records = result.scalars().all()

#         return [
#             {
#                 "id": r.id,
#                 "svc_no": r.svc_no,
#                 "full_name": r.full_name,
#                 "rank": r.rank,
#                 "unit": r.unit,
#                 "appointment": r.appointment,
#                 "age": r.age,
#                 "sex": r.sex,
#                 "height": r.height,
#                 "weight_current": r.weight_current,
#                 "bmi_current": r.bmi_current,
#                 "bmi_status": r.bmi_status,
#                 "cardio_cage": r.cardio_cage,
#                 "step_up_value": r.step_up_value,
#                 "push_up_value": r.push_up_value,
#                 "sit_up_value": r.sit_up_value,
#                 "chin_up_value": r.chin_up_value,
#                 "sit_reach_value": r.sit_reach_value,
#                 "aggregate": r.aggregate,
#                 "grade": r.grade,
#                 "prescription_duration": r.prescription_duration,
#                 "prescription_days": r.prescription_days,
#                 "recommended_activity": r.recommended_activity,
#                 "created_at": r.created_at.isoformat() if r.created_at else None,
            
#             }
#             for r in records
#         ]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    

# @router.get("/pft-results/{result_id}", response_model=dict)
# async def get_pft_result_by_id(
#     result_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get a single PFT result by its database ID
#     """
#     stmt = select(PFTResult).where(PFTResult.id == result_id)
#     result = db.execute(stmt)
#     record = result.scalars().first()

#     if not record:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"PFT result with ID {result_id} not found"
#         )

    
#     return {
#         "id": record.id,
#         "svc_no": record.svc_no,
#         "full_name": record.full_name,
#         "rank": record.rank,
#         "unit": record.unit,
#         "appointment": record.appointment,
#         "age": record.age,
#         "sex": record.sex,
#         "height": record.height,
#         "weight_current": record.weight_current,
#         "bmi_current": record.bmi_current,
#         "bmi_status": record.bmi_status,
#         "cardio_cage": record.cardio_cage,
#         "step_up_value": record.step_up_value,
#         "push_up_value": record.push_up_value,
#         "sit_up_value": record.sit_up_value,
#         "chin_up_value": record.chin_up_value,
#         "sit_reach_value": record.sit_reach_value,
#         "aggregate": record.aggregate,
#         "grade": record.grade,
#         "prescription_duration": record.prescription_duration,
#         "prescription_days": record.prescription_days,
#         "recommended_activity": record.recommended_activity,
#         "created_at": record.created_at.isoformat() if record.created_at else None,
#     }



# @router.get("/pft-results/svc/{svc_no}", response_model=list[dict])
# async def get_pft_results_by_svc_no(
#     svc_no: str,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all PFT results for a specific service number
#     """
#     stmt = (
#         select(PFTResult)
#         .where(PFTResult.svc_no == svc_no)
#         .order_by(PFTResult.created_at.desc())
#     )
#     result = db.execute(stmt)
#     records = result.scalars().all()

#     if not records:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"No PFT results found for service number {svc_no}"
#         )

#     return [
#         {
#             "id": r.id,
#             "full_name": r.full_name,
#             "rank": r.rank,
#             "unit": r.unit,
#             "age": r.age,
#             "sex": r.sex,
#             "aggregate": float(r.aggregate) if r.aggregate else None,
#             "grade": r.grade,
#             "created_at": r.created_at.isoformat() if r.created_at else None,
            
#         }
#         for r in records
#     ]


# class PFTUpdate(BaseModel):
    
#     evaluator_name: Optional[str] = None
#     evaluator_rank: Optional[str] = None
#     grade: Optional[str] = None
#     notes: Optional[str] = None  

# @router.put("/pft-results/{result_id}", response_model=dict)
# async def update_pft_result(
#     result_id: int,
#     update_data: PFTUpdate,
#     db: Session = Depends(get_db)
# ):
#     """
#     Update selected fields of an existing PFT result
#     """
#     stmt = select(PFTResult).where(PFTResult.id == result_id)
#     result = db.execute(stmt)
#     record = result.scalars().first()

#     if not record:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"PFT result with ID {result_id} not found"
#         )

    
#     update_dict = update_data.model_dump(exclude_unset=True)
#     for key, value in update_dict.items():
#         setattr(record, key, value)

#     db.commit()
#     db.refresh(record)

#     return {
#         "id": record.id,
#         "svc_no": record.svc_no,
#         "full_name": record.full_name,
#         "rank": record.rank,
#         "unit": record.unit,
#         "appointment": record.appointment,
#         "age": record.age,
#         "sex": record.sex,
#         "height": record.height,
#         "weight_current": record.weight_current,
#         "bmi_current": record.bmi_current,
#         "bmi_status": record.bmi_status,
#         "cardio_cage": record.cardio_cage,
#         "step_up_value": record.step_up_value,
#         "push_up_value": record.push_up_value,
#         "sit_up_value": record.sit_up_value,
#         "chin_up_value": record.chin_up_value,
#         "sit_reach_value": record.sit_reach_value,
#         "aggregate": record.aggregate,
#         "grade": record.grade,
#         "prescription_duration": record.prescription_duration,
#         "prescription_days": record.prescription_days,
#         "recommended_activity": record.recommended_activity,
#         "created_at": record.created_at.isoformat() if record.created_at else None,
#         "updated_fields": list(update_dict.keys()),
#         "message": "PFT result updated successfully"
#     }


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.schemas import InputSchema
from app.services.database import get_db
from app.services.models import PFTResult
from app.services.naf_pft import compute_naf_pft

router = APIRouter(prefix="/api", tags=["PFT Results"])

# CREATE (Compute + Save) – FRONTEND USER
@router.post("/compute", status_code=status.HTTP_201_CREATED)
def compute_and_save(
    data: InputSchema,
    db: Session = Depends(get_db)
):
    # 🔒 Prevent duplicate entry (svc_no + year)
    existing = db.execute(
        select(PFTResult).where(
            PFTResult.svc_no == data.svc_no,
            PFTResult.year == data.year
        )
    ).scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Record already exists for this service number and year. Contact admin to update."
        )

    result = compute_naf_pft(data)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    db_result = PFTResult(**{
        k: v for k, v in result.items()
        if hasattr(PFTResult, k)
    })

    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return {
        "message": "PFT result saved successfully",
        "record_id": db_result.id
    }


# READ – ADMIN (ALL RESULTS)
@router.get("/pft-results", response_model=List[dict])
def get_all_results(db: Session = Depends(get_db)):
    records = db.execute(
        select(PFTResult).order_by(PFTResult.created_at.desc())
    ).scalars().all()

    return [
        {
            "id": r.id,
            "svc_no": r.svc_no,
            "full_name": r.full_name,
            "rank": r.rank,
            "unit": r.unit,
            "year": r.year,
            "aggregate": r.aggregate,
            "grade": r.grade,
            "created_at": r.created_at
        }
        for r in records
    ]


# READ – BY SERVICE NUMBER (USER)
@router.get("/pft-results/svc/{svc_no}", response_model=List[dict])
def get_by_service_number(
    svc_no: str,
    db: Session = Depends(get_db)
):
    records = db.execute(
        select(PFTResult).where(PFTResult.svc_no == svc_no)
    ).scalars().all()

    if not records:
        raise HTTPException(status_code=404, detail="No records found")

    return [
        {
            "id": r.id,
            "year": r.year,
            "aggregate": r.aggregate,
            "grade": r.grade,
            "created_at": r.created_at
        }
        for r in records
    ]


# UPDATE – ADMIN ONLY
class PFTUpdate(BaseModel):
    evaluator_name: Optional[str] = None
    evaluator_rank: Optional[str] = None
    grade: Optional[str] = None
    notes: Optional[str] = None


@router.put("/pft-results/{result_id}")
def update_pft_result(
    result_id: int,
    update: PFTUpdate,
    db: Session = Depends(get_db)
):
    record = db.get(PFTResult, result_id)

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )

    update_data = update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return {
        "message": "Record updated successfully",
        "updated_fields": list(update_data.keys())
    }

# DELETE – ADMIN ONLY
@router.delete("/pft-results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pft_result(
    result_id: int,
    db: Session = Depends(get_db)
):
    record = db.get(PFTResult, result_id)

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )

    db.delete(record)
    db.commit()