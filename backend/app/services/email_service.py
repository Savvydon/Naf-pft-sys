import os
import traceback
from email.message import EmailMessage
import aiosmtplib


async def send_email_with_pdf(email: str, pdf_bytes: bytes):

    try:
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))

        if not smtp_user or not smtp_password:
            raise ValueError("Missing SMTP credentials")

        message = EmailMessage()

        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "Your NAF Physical Fitness Test Report"

        message.set_content(
            "Dear Personnel,\n\n"
            "Attached is your Nigerian Air Force Physical Fitness Test Report.\n\n"
            "Regards,\n"
            "NAF Fitness Team"
        )

        message.add_attachment(
            pdf_bytes,
            maintype="application",
            subtype="pdf",
            filename="NAF_PFT_Report.pdf"
        )

        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True
        )

        print(f"Email successfully sent to {email}")

        return True

    except Exception as e:

        print("EMAIL SEND FAILED")
        print(str(e))
        print(traceback.format_exc())

        return False