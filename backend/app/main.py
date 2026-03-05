# # backend/app/main.py
# import os
# import sys
# import traceback

# print("=== MAIN.PY START ===")
# print("Python version:", sys.version)
# print("Current working dir:", os.getcwd())
# print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

# from fastapi import FastAPI, Depends, HTTPException, status
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import IntegrityError

# print("Core imports successful")

# try:
#     from app.routes.fitness import router
#     from app.services.email_service import generate_pdf, send_email_with_pdf
#     from app.services.database import engine, get_db
#     from app.services.models import Base, PFTResult
#     from app.schemas import InputSchema
#     from app.services.naf_pft import compute_naf_pft
#     print("All project imports successful")
# except ImportError as e:
#     print("!!! CRITICAL IMPORT ERROR !!!")
#     print("Error:", str(e))
#     print("Traceback:")
#     traceback.print_exc(file=sys.stdout)
#     raise

# app = FastAPI(title="NAF Physical Fitness Test API")

# print("FastAPI app instance created")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],           # TODO: restrict in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# print("CORS middleware added")

# app.include_router(router)

# print("Router included")

# print("Creating database tables...")
# try:
#     Base.metadata.create_all(bind=engine)
#     print("Tables created / already exist")
# except Exception as e:
#     print("!!! FAILED TO CREATE TABLES !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)
#     # You can decide whether to raise or continue — for now we continue

# class ReportRequest(BaseModel):
#     email: str
#     report_data: dict


# @app.post("/send-report")
# async def send_report(request: ReportRequest):
#     pdf_buffer = generate_pdf(request.report_data)

#     success = await send_email_with_pdf(
#         request.email,
#         pdf_buffer,
#         report_data=request.report_data
#     )

#     if success:
#         return {"message": "Email sent successfully", "status": "success"}
    
#     raise HTTPException(
#         status_code=503,
#         detail="Failed to send email. SMTP configuration or network issue."
#     )


# @app.post("/api/compute")
# def compute_pft(data: InputSchema, db: Session = Depends(get_db)):
#     """
#     Compute NAF PFT score, save to database (if not duplicate), return full result.
#     """
#     if not (2000 <= data.year <= 2100):
#         raise HTTPException(
#             status_code=422,
#             detail="Year must be between 2000 and 2100"
#         )

#     # Use modern model_dump() instead of deprecated dict()
#     result = compute_naf_pft(data.model_dump())

#     if "error" in result:
#         raise HTTPException(status_code=400, detail=result["error"])

#     # Only keep fields that actually exist in PFTResult model
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
#             "message": "PFT result computed and saved successfully",
#             "duplicate": False
#         }

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=409,
#             detail="A Physical Fitness Test result already exists for this Service Number and Year."
#         )
#     except Exception as e:
#         db.rollback()
#         print("Database save failed:", str(e))
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500,
#             detail=f"Unexpected database error: {str(e)}"
#         )


# @app.get("/api/exists/{svc_no}/{year}")
# def check_exists(svc_no: str, year: int, db: Session = Depends(get_db)):
#     """Check if a record already exists for given svc_no + year"""
#     exists = (
#         db.query(PFTResult)
#         .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
#         .first()
#         is not None
#     )
#     return {"exists": exists, "svc_no": svc_no, "year": year}


# print("-- MAIN.PY FULLY LOADED --")

# backend/app/main.py
import os
import sys
import traceback
from datetime import datetime

print("=== MAIN.PY START ===")
print("Python version:", sys.version.strip())
print("Current working dir:", os.getcwd())
print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError

print("Core imports successful")

try:
    from app.routes.fitness import router
    from app.services.email_service import generate_pdf, send_email_with_pdf
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

app = FastAPI(title="NAF Physical Fitness Test API")

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


# ====================== HELPER: Normalize Service Number ======================
def normalize_svc_no(svc_no: str) -> str:
    """Clean and normalize service number (handles NAF/2670, NAF24/3319, etc.)"""
    if not svc_no:
        return "NAF"

    cleaned = (
        svc_no.strip()
        .replace(" ", "")           # remove spaces
        .replace("-", "")           # remove dashes
        .upper()
    )

    # Collapse multiple slashes
    cleaned = "/".join(filter(None, cleaned.split("/")))

    # Ensure it starts with NAF
    if not cleaned.startswith("NAF"):
        cleaned = "NAF" + cleaned

    return cleaned


# ====================== HEALTH CHECK ======================
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


class ReportRequest(BaseModel):
    email: str
    report_data: dict


@app.post("/send-report")
async def send_report(request: ReportRequest):
    pdf_buffer = generate_pdf(request.report_data)
    success = await send_email_with_pdf(
        request.email, pdf_buffer, request.report_data
    )
    if success:
        return {"message": "Email sent successfully", "status": "success"}
    raise HTTPException(503, "Failed to send email")


# ====================== CHECK EXISTS (FIXED) ======================
@app.get("/api/exists/{svc_no}/{year}")
def check_exists(svc_no: str, year: int, db: Session = Depends(get_db)):
    """Handle service numbers like NAF24/3319, NAF/2291, etc."""
    svc_no = normalize_svc_no(svc_no)

    exists = (
        db.query(PFTResult)
        .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
        .first()
        is not None
    )
    return {"exists": exists, "svc_no": svc_no, "year": year}


# ====================== COMPUTE PFT (FIXED) ======================
@app.post("/api/compute")
def compute_pft(data: InputSchema, db: Session = Depends(get_db)):
    if not (2000 <= data.year <= 2100):
        raise HTTPException(422, "Year must be between 2000 and 2100")

    # Normalize service number before processing
    data_dict = data.model_dump()
    data_dict["svc_no"] = normalize_svc_no(data_dict.get("svc_no", ""))

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
        raise HTTPException(500, f"Unexpected database error: {str(e)}")


print("-- MAIN.PY FULLY LOADED --")