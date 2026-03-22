#====Updated Email Service Using Resend
import os
import traceback
import httpx


async def send_email_with_pdf(email: str, pdf_bytes: bytes):
    """
    Send email with PDF attachment using Resend API (HTTP-based, works on Render free tier).
    """
    try:
        # Try Resend first (HTTP API - not blocked by Render)
        resend_api_key = os.getenv("RESEND_API_KEY")
        
        if resend_api_key:
            return await send_with_resend(email, pdf_bytes, resend_api_key)
        
        # Fallback to SMTP if not on Render free tier
        return await send_with_smtp(email, pdf_bytes)
        
    except Exception as e:
        print(f"[EMAIL FAILED] {type(e).__name__}: {e}")
        print(traceback.format_exc())
        return False


async def send_with_resend(email: str, pdf_bytes: bytes, api_key: str):
    """Send email using Resend HTTP API"""
    try:
        import base64
        
        print(f"[RESEND] Sending to {email}")
        
        # Convert PDF to base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # Prepare the email payload
        payload = {
            "from": os.getenv("EMAIL_FROM", "NAF PFT <onboarding@resend.dev>"),
            "to": [email],
            "subject": "Your NAF Physical Fitness Test Report",
            "text": "Dear Personnel,\n\nAttached is your Nigerian Air Force Physical Fitness Test Report.\n\nRegards,\nNAF Fitness Team",
            "attachments": [
                {
                    "filename": "NAF_PFT_Report.pdf",
                    "content": pdf_base64
                }
            ]
        }
        
        # Send via Resend API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code == 200:
                print(f"[RESEND SUCCESS] Email sent to {email}")
                return True
            else:
                print(f"[RESEND ERROR] Status {response.status_code}: {response.text}")
                return False
                
    except Exception as e:
        print(f"[RESEND ERROR] {e}")
        return False


async def send_with_smtp(email: str, pdf_bytes: bytes):
    """Fallback SMTP method"""
    try:
        from email.message import EmailMessage
        import aiosmtplib
        
        smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        
        print(f"[SMTP FALLBACK] Using {smtp_host}:{smtp_port}")

        if not smtp_user or not smtp_password:
            raise ValueError("Missing SMTP credentials")

        message = EmailMessage()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "Your NAF Physical Fitness Test Report"
        message.set_content(
            "Dear Personnel,\n\nAttached is your Nigerian Air Force Physical Fitness Test Report.\n\nRegards,\nNAF Fitness Team"
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
            start_tls=True,
            timeout=30
        )

        print(f"[SMTP SUCCESS] Email sent to {email}")
        return True

    except Exception as e:
        print(f"[SMTP ERROR] {e}")
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
#         # Use your exact environment variable names
#         smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))
        
#         # Debug output (will show in Render logs)
#         print(f"[EMAIL DEBUG] SMTP_USER: {smtp_user}")
#         print(f"[EMAIL DEBUG] SMTP_HOST: {smtp_host}")
#         print(f"[EMAIL DEBUG] SMTP_PORT: {smtp_port}")
#         print(f"[EMAIL DEBUG] PASSWORD SET: {'Yes (length: ' + str(len(smtp_password)) + ')' if smtp_password else 'NO - MISSING!'}")
#         print(f"[EMAIL DEBUG] RECIPIENT: {email}")
#         print(f"[EMAIL DEBUG] PDF SIZE: {len(pdf_bytes) if pdf_bytes else 0} bytes")

#         if not smtp_user:
#             raise ValueError("Missing SMTP_USER or EMAIL_FROM environment variable")
            
#         if not smtp_password:
#             raise ValueError("Missing SMTP_PASSWORD environment variable")

#         if not pdf_bytes or len(pdf_bytes) == 0:
#             raise ValueError("No PDF data provided")

#         # Create message
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

#         # Attach PDF
#         message.add_attachment(
#             pdf_bytes,
#             maintype="application",
#             subtype="pdf",
#             filename="NAF_PFT_Report.pdf"
#         )

#         print(f"[EMAIL DEBUG] Connecting to {smtp_host}:{smtp_port}...")
        
#         # Send using aiosmtplib with explicit STARTTLS on port 587
#         await aiosmtplib.send(
#             message,
#             hostname=smtp_host,
#             port=smtp_port,
#             username=smtp_user,
#             password=smtp_password,
#             start_tls=True,  # Explicit STARTTLS for port 587
#             timeout=30
#         )

#         print(f"[EMAIL SUCCESS] Email sent successfully to {email}")
#         return True

#     except aiosmtplib.SMTPAuthenticationError as e:
#         print(f"[EMAIL AUTH ERROR] Authentication failed: {e}")
#         print(f"[EMAIL AUTH ERROR] Code: {e.code if hasattr(e, 'code') else 'N/A'}")
#         print(f"[EMAIL AUTH ERROR] This usually means:")
#         print(f"  1. Wrong username/password")
#         print(f"  2. 2FA is not enabled on the Gmail account")
#         print(f"  3. App Password was generated incorrectly")
#         print(f"  4. Google blocked the login attempt")
#         return False
        
#     except aiosmtplib.SMTPException as e:
#         print(f"[EMAIL SMTP ERROR] {type(e).__name__}: {e}")
#         return False
        
#     except Exception as e:
#         print(f"[EMAIL FAILED] Unexpected error: {type(e).__name__}: {e}")
#         print(traceback.format_exc())
#         return False


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