from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import select
from app.services.database import SessionLocal, engine
from app.services.models import Base, PFTResult
from app.services.schemas import InputSchema
from app.services.naf_pft import compute_naf_pft
from app.services.email_service import generate_pdf, send_email_with_pdf

# -------------------- APP INIT --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if not exist
Base.metadata.create_all(bind=engine)

# -------------------- HELPERS --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- MODELS --------------------
class ReportRequest(BaseModel):
    email: str
    report_data: dict


def save_result_to_db(result: dict):
    db: Session = SessionLocal()
    try:
        db_result = PFTResult(**{k: v for k, v in result.items() if hasattr(PFTResult, k)})
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        return db_result
    finally:
        db.close()


# -------------------- ROUTES --------------------
@app.post("/send-report")
async def send_report(request: ReportRequest):
    pdf_buffer = generate_pdf(request.report_data)
    
    success = send_email_with_pdf(
        request.email,
        pdf_buffer,
        report_data=request.report_data
    )
    
    if success:
        return {"message": "Email sent successfully", "status": "success"}
    else:
        return {"message": "Failed to send email. Check server logs.", "status": "error"}


# ---------- COMPUTE PFT AND RETURN FULL DATA ----------
@app.post("/api/compute")
def compute(data: InputSchema, db: Session = Depends(get_db)):
    # Run computation logic
    result = compute_naf_pft(data)

    if "error" in result:
        return result

    try:
        # Save only columns that exist in PFTResult
        db_result = PFTResult(**{k: v for k, v in result.items() if hasattr(PFTResult, k)})
        db.add(db_result)
        db.commit()
        db.refresh(db_result)

        # Add saved ID to the full result
        result["saved_id"] = db_result.id

        # Return full result (including extra computed fields)
        return result

    except Exception as e:
        db.rollback()
        import traceback
        return {
            **result,
            "save_error": str(e),
            "save_trace": traceback.format_exc()[:500]
        }


# ---------- GET RESULTS BY SERVICE NUMBER ----------
@app.get("/results/{svc_no}")
def get_results(svc_no: str):
    db = SessionLocal()
    try:
        results = db.query(PFTResult).filter(PFTResult.svc_no == svc_no).all()
        return results
    finally:
        db.close()


# ---------- ADMIN: GET ALL RESULTS ----------
@app.get("/pft-results", response_model=List[dict])
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