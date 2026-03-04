from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.email_service import generate_pdf, send_email_with_pdf

router = APIRouter(prefix="/api/email", tags=["Email"])


class EmailRequest(BaseModel):
    email: str
    report_data: dict


@router.post("/send")
def send_report(req: EmailRequest):
    pdf = generate_pdf(req.report_data)

    success = send_email_with_pdf(
        req.email,
        pdf,
        report_data=req.report_data
    )

    if not success:
        raise HTTPException(status_code=500, detail="Email failed")

    return {"message": "Email sent successfully"}