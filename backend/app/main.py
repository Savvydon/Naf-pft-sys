from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.routes.fitness import router
from .services.email_service import generate_pdf, send_email_with_pdf
from .services.database import engine
from .services.models import Base
from .services.database import SessionLocal
from sqlalchemy.orm import Session
from .services.models import PFTResult
from .services.database import SessionLocal
from .services.naf_pft import compute_naf_pft
from .services.schemas import InputSchema


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

Base.metadata.create_all(bind=engine)

class ReportRequest(BaseModel):
    email: str
    report_data: dict


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_result_to_db(result: dict):
    db: Session = SessionLocal()

    try:
        db_result = PFTResult(**result)
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
    finally:
        db.close()

@app.post("/send-report")
async def send_report(request: ReportRequest):
    pdf_buffer = generate_pdf(request.report_data)
    
    success = send_email_with_pdf(
        request.email,
        pdf_buffer,
        report_data=request.report_data 
    )
    
    if success:
        return {"message": "Email sent successfully to real inbox", "status": "success"}
    else:
        return {"message": "Failed to send email. Check server logs.", "status": "error"}

@app.post("/api/compute")
def compute(data: InputSchema, db: Session = Depends(get_db)):      

    result = compute_naf_pft(data)

    print("Computed result keys:", list(result.keys()))   
    if "error" in result:
        print("Computation error:", result["error"])
        return result

    try:
        db_result = PFTResult(**{
            k: v for k, v in result.items()
            if hasattr(PFTResult, k) 
        })

        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        print(f"SAVED → ID: {db_result.id} | Service No: {db_result.svc_no}")
        return {**result, "saved_id": db_result.id}  

    except Exception as e:
        db.rollback()
        import traceback
        print("SAVE FAILED:", str(e))
        return {
            **result,
            "save_error": str(e),
            "save_trace": traceback.format_exc()[:500]   
        }


@app.get("/results/{svc_no}")
def get_results(svc_no: str):
    db = SessionLocal()
    try:
        results = db.query(PFTResult).filter(PFTResult.svc_no == svc_no).all()
        return results
    finally:
        db.close()