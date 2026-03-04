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

# -------------------- CREATE / COMPUTE --------------------
@router.post("/compute", status_code=status.HTTP_201_CREATED)
def compute_and_save(
    data: InputSchema,
    db: Session = Depends(get_db)
):
    # Prevent duplicate entry (svc_no + year)
    existing = db.execute(
        select(PFTResult).where(
            (PFTResult.svc_no == data.svc_no) &
            (PFTResult.year == data.year)
        )
    ).scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Record already exists for this Service Number and Year. Contact admin to update."
        )

    # Run computation
    result = compute_naf_pft(data)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Save to database
    db_result = PFTResult(**{
        k: v for k, v in result.items() if hasattr(PFTResult, k)
    })
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return {
        "message": "PFT result saved successfully",
        "record_id": db_result.id,
        **result
    }

# -------------------- READ ALL (ADMIN) --------------------
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

# -------------------- READ BY SERVICE NUMBER (USER) --------------------
@router.get("/pft-results/svc/{svc_no}", response_model=List[dict])
def get_by_service_number(svc_no: str, db: Session = Depends(get_db)):
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

# -------------------- UPDATE (ADMIN) --------------------
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return {
        "message": "Record updated successfully",
        "updated_fields": list(update_data.keys())
    }

# -------------------- DELETE (ADMIN) --------------------
@router.delete("/pft-results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pft_result(result_id: int, db: Session = Depends(get_db)):
    record = db.get(PFTResult, result_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    db.delete(record)
    db.commit()