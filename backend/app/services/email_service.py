import os
import traceback
from email.message import EmailMessage
import aiosmtplib


async def send_email_with_pdf(email: str, pdf_bytes: bytes):
    """
    Send email with PDF attachment.
    """
    try:
        # Use your exact environment variable names
        smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        
        # Debug output (will show in Render logs)
        print(f"[EMAIL DEBUG] SMTP_USER: {smtp_user}")
        print(f"[EMAIL DEBUG] SMTP_HOST: {smtp_host}")
        print(f"[EMAIL DEBUG] SMTP_PORT: {smtp_port}")
        print(f"[EMAIL DEBUG] PASSWORD SET: {'Yes (length: ' + str(len(smtp_password)) + ')' if smtp_password else 'NO - MISSING!'}")
        print(f"[EMAIL DEBUG] RECIPIENT: {email}")
        print(f"[EMAIL DEBUG] PDF SIZE: {len(pdf_bytes) if pdf_bytes else 0} bytes")

        if not smtp_user:
            raise ValueError("Missing SMTP_USER or EMAIL_FROM environment variable")
            
        if not smtp_password:
            raise ValueError("Missing SMTP_PASSWORD environment variable")

        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("No PDF data provided")

        # Create message
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

        # Attach PDF
        message.add_attachment(
            pdf_bytes,
            maintype="application",
            subtype="pdf",
            filename="NAF_PFT_Report.pdf"
        )

        print(f"[EMAIL DEBUG] Connecting to {smtp_host}:{smtp_port}...")
        
        # Send using aiosmtplib with explicit STARTTLS on port 587
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True,  # Explicit STARTTLS for port 587
            timeout=30
        )

        print(f"[EMAIL SUCCESS] Email sent successfully to {email}")
        return True

    except aiosmtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL AUTH ERROR] Authentication failed: {e}")
        print(f"[EMAIL AUTH ERROR] Code: {e.code if hasattr(e, 'code') else 'N/A'}")
        print(f"[EMAIL AUTH ERROR] This usually means:")
        print(f"  1. Wrong username/password")
        print(f"  2. 2FA is not enabled on the Gmail account")
        print(f"  3. App Password was generated incorrectly")
        print(f"  4. Google blocked the login attempt")
        return False
        
    except aiosmtplib.SMTPException as e:
        print(f"[EMAIL SMTP ERROR] {type(e).__name__}: {e}")
        return False
        
    except Exception as e:
        print(f"[EMAIL FAILED] Unexpected error: {type(e).__name__}: {e}")
        print(traceback.format_exc())
        return False


# import os
# import traceback
# from email.message import EmailMessage
# import aiosmtplib


# async def send_email_with_pdf(email: str, pdf_bytes: bytes):
#     """
#     Send email with PDF attachment.
#     """
#     try:
#         smtp_user = os.getenv("SMTP_USER")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))

#         if not smtp_user or not smtp_password:
#             raise ValueError("Missing SMTP credentials")

#         if not pdf_bytes:
#             raise ValueError("No PDF data provided")

#         message = EmailMessage()
#         message["From"] = smtp_user
#         message["To"] = email
#         message["Subject"] = "Your NAF Physical Fitness Test Report"

#         message.set_content(
#             "Dear Personnel,\n\n"
#             "Attached is your Nigerian Air Force Physical Fitness Test Report.\n\n"
#             "Regards,\n"
#             "NAF Fitness Team"
#         )

#         message.add_attachment(
#             pdf_bytes,
#             maintype="application",
#             subtype="pdf",
#             filename="NAF_PFT_Report.pdf"
#         )

#         await aiosmtplib.send(
#             message,
#             hostname=smtp_host,
#             port=smtp_port,
#             username=smtp_user,
#             password=smtp_password,
#             start_tls=True
#         )

#         print(f"Email successfully sent to {email}")
#         return True

#     except Exception as e:
#         print("EMAIL SEND FAILED")
#         print(str(e))
#         print(traceback.format_exc())
#         return False