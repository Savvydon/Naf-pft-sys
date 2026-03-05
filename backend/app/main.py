from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.routes.fitness import router
from app.services.email_service import generate_pdf, send_email_with_pdf
from app.services.database import engine, get_db
from app.services.models import Base, PFTResult
from app.schemas import FitnessInput
from app.services.naf_pft import compute_naf_pft

app = FastAPI(title="NAF Physical Fitness Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # ← In production: restrict to your frontend domain(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

Base.metadata.create_all(bind=engine)


class ReportRequest(BaseModel):
    email: str
    report_data: dict


@app.post("/send-report")
async def send_report(request: ReportRequest):
    pdf_buffer = generate_pdf(request.report_data)

    success = await send_email_with_pdf(
        request.email,
        pdf_buffer,
        report_data=request.report_data
    )

    if success:
        return {"message": "Email sent successfully", "status": "success"}
    
    raise HTTPException(
        status_code=503,
        detail="Failed to send email. SMTP configuration or network issue."
    )


@app.post("/api/compute")
def compute_pft(data: FitnessInput, db: Session = Depends(get_db)):
    """
    Compute NAF PFT score, save to database (if not duplicate), return full result.
    """
    if not (2000 <= data.year <= 2100):
        raise HTTPException(422, detail="Year must be between 2000 and 2100")

    # Compute result
    result = compute_naf_pft(data.dict())

    if "error" in result:
        raise HTTPException(400, detail=result["error"])

    # Prepare only fields that exist in the PFTResult model
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
            "message": "PFT result computed and saved successfully",
            "duplicate": False
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A Physical Fitness Test result already exists for this Service Number and Year."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(500, detail=f"Unexpected database error: {str(e)}")


@app.get("/api/exists/{svc_no}/{year}")
def check_exists(svc_no: str, year: int, db: Session = Depends(get_db)):
    """Check if a record already exists for given svc_no + year"""
    exists = (
        db.query(PFTResult)
        .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
        .first()
        is not None
    )
    return {"exists": exists, "svc_no": svc_no, "year": year}