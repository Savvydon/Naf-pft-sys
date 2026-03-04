from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.database import Base, engine
from app.routes.fitness import router as fitness_router
from app.services.email_service import generate_pdf, send_email_with_pdf

# -------------------- APP INIT --------------------
app = FastAPI(title="NAF PFT System")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",             # local frontend
        "https://your-hosted-frontend.com"  # production frontend
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DATABASE --------------------
Base.metadata.create_all(bind=engine)

# -------------------- ROUTERS --------------------
app.include_router(fitness_router)

# -------------------- EMAIL REPORT ROUTE --------------------
class ReportRequest(BaseModel):
    email: str
    report_data: dict

@app.post("/send-report")
async def send_report(request: ReportRequest):
    pdf_buffer = generate_pdf(request.report_data)
    success = send_email_with_pdf(
        request.email,
        pdf_buffer,
        report_data=request.report_data
    )
    return {"status": "success" if success else "error"}