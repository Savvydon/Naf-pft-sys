import os
import traceback
import base64
import httpx


async def send_email_with_pdf(email: str, pdf_bytes: bytes, personnel_name: str = None):
    """
    Send email with PDF attachment using Brevo API.
    """
    try:
        brevo_api_key = os.getenv("BREVO_API_KEY")
        
        if not brevo_api_key:
            print("[EMAIL ERROR] BREVO_API_KEY not set")
            return False
        
        print(f"[BREVO] Sending to {email}")
        print(f"[BREVO] Personnel name: {personnel_name}")
        print(f"[BREVO] PDF size: {len(pdf_bytes)} bytes")
        
        # Convert PDF to base64
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # Personalized greeting
        if personnel_name and personnel_name.strip():
            greeting = f"Dear {personnel_name.strip()}"
        else:
            greeting = "Dear Personnel"
        
        # Prepare the email payload
        payload = {
            "sender": {
                "name": "NAF PFT System",
                "email": os.getenv("EMAIL_FROM", "noreply@brevosend.com")
            },
            "to": [
                {
                    "email": email,
                    "name": personnel_name or "Personnel"
                }
            ],
            "subject": "Your NAF Physical Fitness Test Report",
            "textContent": f"{greeting},\n\nAttached is your Nigerian Air Force Physical Fitness Test Report.\n\nRegards,\nNAF Fitness Team",
            "attachment": [
                {
                    "name": "NAF_PFT_Report.pdf",
                    "content": pdf_base64
                }
            ]
        }
        
        # Send via Brevo API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "accept": "application/json",
                    "api-key": brevo_api_key,
                    "content-type": "application/json"
                },
                json=payload
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"[BREVO SUCCESS] Email sent to {email}, Message ID: {result.get('messageId')}")
                return True
            else:
                print(f"[BREVO ERROR] Status {response.status_code}: {response.text}")
                return False
                
    except Exception as e:
        print(f"[EMAIL FAILED] {type(e).__name__}: {e}")
        traceback.print_exc()
        return False

# #====BREVO API===
# import os
# import traceback
# import base64
# import httpx


# async def send_email_with_pdf(email: str, pdf_bytes: bytes):
#     """
#     Send email with PDF attachment using Brevo API (HTTP-based, works on Render free tier).
#     No domain verification required - can send to any email address.
#     """
#     try:
#         brevo_api_key = os.getenv("BREVO_API_KEY")
        
#         if not brevo_api_key:
#             print("[EMAIL ERROR] BREVO_API_KEY not set in environment variables")
#             return False
        
#         print(f"[BREVO] Sending email to {email}")
#         print(f"[BREVO] PDF size: {len(pdf_bytes)} bytes")
        
#         # Convert PDF to base64
#         pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
#         # Prepare the email payload for Brevo API
#         payload = {
#             "sender": {
#                 "name": "NAF PFT System",
#                 "email": os.getenv("EMAIL_FROM", "nafpftest1@gmail.com")  # Your Gmail is fine here
#             },
#             "to": [
#                 {
#                     "email": email,
#                     "name": "Personnel"
#                 }
#             ],
#             "subject": "Your NAF Physical Fitness Test Report",
#             "textContent": "Dear Personnel,\n\nAttached is your Nigerian Air Force Physical Fitness Test Report.\n\nRegards,\nNAF Fitness Team",
#             "attachment": [
#                 {
#                     "name": "NAF_PFT_Report.pdf",
#                     "content": pdf_base64
#                 }
#             ]
#         }
        
#         # Send via Brevo API
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             response = await client.post(
#                 "https://api.brevo.com/v3/smtp/email",
#                 headers={
#                     "accept": "application/json",
#                     "api-key": brevo_api_key,
#                     "content-type": "application/json"
#                 },
#                 json=payload
#             )
            
#             if response.status_code in [200, 201]:
#                 result = response.json()
#                 print(f"[BREVO SUCCESS] Email sent to {email}, Message ID: {result.get('messageId')}")
#                 return True
#             else:
#                 print(f"[BREVO ERROR] Status {response.status_code}: {response.text}")
#                 return False
                
#     except Exception as e:
#         print(f"[EMAIL FAILED] {type(e).__name__}: {e}")
#         traceback.print_exc()
#         return False


# #====Updated Email Service Using Resend
# import os
# import traceback
# import base64
# import httpx


# async def send_email_with_pdf(email: str, pdf_bytes: bytes):
#     """
#     Send email with PDF attachment using Resend API (HTTP-based, works on Render free tier).
#     """
#     try:
#         resend_api_key = os.getenv("RESEND_API_KEY")
        
#         if not resend_api_key:
#             print("[EMAIL ERROR] RESEND_API_KEY not set in environment variables")
#             return False
        
#         print(f"[RESEND] Sending email to {email}")
#         print(f"[RESEND] PDF size: {len(pdf_bytes)} bytes")
        
#         # Convert PDF to base64
#         pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
#         # Prepare the email payload
#         payload = {
#             "from": os.getenv("EMAIL_FROM", "onboarding@resend.dev"),
#             "to": [email],
#             "subject": "Your NAF Physical Fitness Test Report",
#             "text": "Dear Personnel,\n\nAttached is your Nigerian Air Force Physical Fitness Test Report.\n\nRegards,\nNAF Fitness Team",
#             "attachments": [
#                 {
#                     "filename": "NAF_PFT_Report.pdf",
#                     "content": pdf_base64
#                 }
#             ]
#         }
        
#         # Send via Resend API
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             response = await client.post(
#                 "https://api.resend.com/emails",
#                 headers={
#                     "Authorization": f"Bearer {resend_api_key}",
#                     "Content-Type": "application/json"
#                 },
#                 json=payload
#             )
            
#             if response.status_code == 200:
#                 result = response.json()
#                 print(f"[RESEND SUCCESS] Email sent to {email}, ID: {result.get('id')}")
#                 return True
#             else:
#                 print(f"[RESEND ERROR] Status {response.status_code}: {response.text}")
#                 return False
                
#     except Exception as e:
#         print(f"[EMAIL FAILED] {type(e).__name__}: {e}")
#         traceback.print_exc()
#         return False

