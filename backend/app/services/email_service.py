import io
import os
import traceback
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from email.message import EmailMessage
from dotenv import load_dotenv
import aiosmtplib

load_dotenv()


def generate_pdf(report_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30*mm,
        leftMargin=30*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )

    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("<b>NIGERIAN AIR FORCE</b>", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("<b>PHYSICAL FITNESS TEST REPORT</b>", styles["Heading2"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(f"<b>Service No:</b> {report_data.get('svc_no', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Full Name:</b> {report_data.get('full_name', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Rank:</b> {report_data.get('rank', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Unit:</b> {report_data.get('unit', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Age:</b> {report_data.get('age', 'N/A')} | <b>Sex:</b> {report_data.get('sex', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Date:</b> {report_data.get('date', 'N/A')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>RESULT SUMMARY</b>", styles["Heading3"]))
    elements.append(Paragraph(f"Aggregate Score: {report_data.get('aggregate', 'N/A')}", styles["Normal"]))
    elements.append(Paragraph(f"Grade: <b>{report_data.get('grade', 'N/A')}</b>", styles["Normal"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(f"<b>Recommended Activity:</b> {report_data.get('recommended_activity', 'N/A')}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer


async def send_email_with_pdf(email: str, pdf_buffer: io.BytesIO, report_data: dict = None):
    try:
        from_email = os.getenv("FROM_EMAIL", os.getenv("GMAIL_USER"))
        app_password = os.getenv("GMAIL_APP_PASSWORD")

        if not from_email or not app_password:
            raise ValueError("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env")

        message = EmailMessage()
        message["From"] = from_email
        message["To"] = email
        message["Subject"] = "Your NAF Physical Fitness Test Report"

        
        body_text = (
            "Dear User,\n\n"
            "Attached is your official NAF PFT Report PDF.\n"
        )
        if report_data:
            body_text += (
                f"Aggregate Score: {report_data.get('aggregate', 'N/A')}\n"
                f"Grade: {report_data.get('grade', 'N/A')}\n\n"
            )
        body_text += "This is a real email sent via Gmail SMTP.\n\nRegards,\nNAF Fitness Team"

        message.set_content(body_text)

        pdf_buffer.seek(0)
        message.add_attachment(
            pdf_buffer.read(),
            maintype="application",
            subtype="pdf",
            filename="NAF_PFT_Report.pdf"
        )

        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            username=from_email,
            password=app_password,
            start_tls=True,
            use_tls=False,
            timeout=20,
        )

        print(f"Real email sent to {email} via Gmail SMTP")
        return True

    except Exception as e:
        print(f"Gmail send failed to {email}: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        return False