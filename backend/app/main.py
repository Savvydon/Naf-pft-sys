import os
import sys
import traceback
from datetime import datetime

print("=== MAIN.PY START ===")
print("Python version:", sys.version.strip())
print("Current working dir:", os.getcwd())
print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

print("Core imports successful")

try:
    from app.routes.fitness import router
    from app.services.email_service import send_email_with_pdf
    from app.services.database import engine, get_db
    from app.services.models import Base, PFTResult
    from app.schemas import InputSchema
    from app.services.naf_pft import compute_naf_pft
    print("All project imports successful")
except ImportError as e:
    print("!!! CRITICAL IMPORT ERROR !!!")
    print("Error:", str(e))
    traceback.print_exc(file=sys.stdout)
    sys.exit(1)

app = FastAPI(
    title="NAF Physical Fitness Test API",
    description="API for Nigerian Air Force Physical Fitness Test computation and storage",
    version="1.0.0",
)

print("FastAPI app instance created")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("CORS middleware added")

app.include_router(router)

print("Router included")


# ROOT ROUTE
@app.get("/")
@app.head("/")
def root():
    return {"status": "ok", "message": "NAF PFT API is running"}


# HEALTH CHECK
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Backend is running"
    }


print("Creating database tables...")

try:
    Base.metadata.create_all(bind=engine)
    print("Tables created / already exist")
except Exception as e:
    print("!!! FAILED TO CREATE TABLES !!!")
    print("Error:", str(e))
    traceback.print_exc(file=sys.stdout)


# SEND EMAIL REPORT WITH PDF
@app.post("/send-report")
async def send_report(
    email: str = Form(...),
    file: UploadFile = File(...)
):

    try:
        pdf_bytes = await file.read()

        success = await send_email_with_pdf(
            email=email,
            pdf_bytes=pdf_bytes
        )

        if success:
            return {
                "status": "success",
                "message": "Email sent successfully"
            }

        raise HTTPException(
            status_code=500,
            detail="Email sending failed"
        )

    except Exception as e:
        print("EMAIL ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# CHECK IF RESULT EXISTS
@app.get("/api/exists/{prefix}/{number}/{year}")
def check_exists(prefix: str, number: str, year: int, db: Session = Depends(get_db)):

    try:
        svc_no = f"{prefix}/{number}".strip("/")
        svc_no = "/".join(part.strip() for part in svc_no.split("/"))
        svc_no = svc_no.upper()

        if not svc_no.startswith("NAF"):
            svc_no = "NAF/" + svc_no.lstrip("/")

        print(f"[EXISTS CHECK] merged svc_no: '{svc_no}', year: {year}")

        exists = (
            db.query(PFTResult)
            .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
            .first()
            is not None
        )

        return {"exists": exists, "svc_no": svc_no, "year": year}

    except Exception as e:
        error_msg = f"Exists check failed: {str(e)}"
        print(f"[EXISTS ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)


# COMPUTE PFT
@app.post("/api/compute")
def compute_pft(data: InputSchema, db: Session = Depends(get_db)):

    if not (2000 <= data.year <= 2100):
        raise HTTPException(422, "Year must be between 2000 and 2100")

    data_dict = data.model_dump()

    svc_no = data_dict.get("svc_no", "").strip()

    if '/' in svc_no:
        svc_no = "/".join(part.strip() for part in svc_no.split("/"))

    if not svc_no.startswith("NAF"):
        svc_no = "NAF" + svc_no

    data_dict["svc_no"] = svc_no

    print(f"[COMPUTE] svc_no: '{svc_no}', year: {data.year}")

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
            "message": "PFT result computed and saved successfully",
        }

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            409,
            "A Physical Fitness Test result already exists for this Service Number and Year."
        )

    except Exception as e:
        db.rollback()

        print("Database save failed:", str(e))
        traceback.print_exc()

        raise HTTPException(
            500,
            f"Unexpected database error: {str(e)}"
        )


print("-- MAIN.PY FULLY LOADED --")