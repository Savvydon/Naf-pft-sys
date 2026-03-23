import os
import sys
import traceback
from datetime import datetime

print("=== MAIN.PY START ===")
print("Python version:", sys.version.strip())
print("Current working dir:", os.getcwd())
print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

# Check email env vars at startup
print("BREVO_API_KEY present?", "yes" if os.getenv("BREVO_API_KEY") else "NO")

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

print("Core imports successful")

try:
    from app.routes.fitness import router as fitness_router
    from app.routes.auth import router as auth_router
    from app.routes.superadmin import router as superadmin_router
    from app.services.email_service import send_email_with_pdf
    from app.services.database import engine, get_db
    from app.services.models import Base, PFTResult, User
    from app.schemas import InputSchema
    from app.services.naf_pft import compute_naf_pft
    from app.services.auth import require_evaluator, get_current_user, require_admin, clear_session_cookie
    print("All project imports successful")

except ImportError as e:
    print("!!! CRITICAL IMPORT ERROR !!!")
    print("Error:", str(e))
    traceback.print_exc(file=sys.stdout)
    sys.exit(1)

app = FastAPI(
    title="NAF Physical Fitness Test API",
    description="API for Nigerian Air Force Physical Fitness Test computation and storage",
    version="2.0.0",
)

print("FastAPI app instance created")

# CORS - Configured with your specific frontend URLs
DEFAULT_ORIGINS = "http://localhost:5173,https://naf-pft-sys.vercel.app"
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

print(f"CORS allowed origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

print("CORS middleware added with credentials support")

# Register routers
app.include_router(fitness_router)
app.include_router(auth_router)
app.include_router(superadmin_router)

print("Routers included")

# Create database tables
print("Creating database tables...")

try:
    Base.metadata.create_all(bind=engine)
    print("Tables created / already exist")

except Exception as e:
    print("!!! FAILED TO CREATE TABLES !!!")
    print("Error:", str(e))
    traceback.print_exc(file=sys.stdout)

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

# LOGOUT ENDPOINT
@app.post("/logout")
def logout_endpoint(response: Response):
    clear_session_cookie(response)
    return {"message": "Logged out successfully"}

# TEST EMAIL ENDPOINT - Simple test without PDF
@app.get("/test-email")
async def test_email():
    """Test email configuration without sending actual email"""
    try:
        from email.message import EmailMessage
        import aiosmtplib
        
        smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        
        # Try to connect and authenticate only
        smtp = aiosmtplib.SMTP(hostname=smtp_host, port=smtp_port)
        await smtp.connect()
        await smtp.starttls()
        await smtp.login(smtp_user, smtp_password)
        await smtp.quit()
        
        return {
            "status": "success",
            "message": "SMTP connection and authentication successful",
            "smtp_user": smtp_user,
            "smtp_host": smtp_host
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

# SEND EMAIL REPORT - JSON VERSION
@app.post("/send-report")
async def send_report(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Send PFT report via email (simple text version for testing).
    """
    try:
        email = data.get("email")
        if not email:
            raise HTTPException(400, "Email is required")

        from email.message import EmailMessage
        import aiosmtplib
        
        smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))

        if not smtp_user or not smtp_password:
            raise HTTPException(500, "SMTP not configured on server")

        message = EmailMessage()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "NAF PFT Test Email"
        message.set_content("This is a test email from NAF PFT system.")

        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True
        )

        return {"status": "success", "message": "Test email sent"}

    except Exception as e:
        print("EMAIL ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# SEND REPORT PDF - FILE UPLOAD VERSION WITH PERSONNEL NAME
@app.post("/send-report-pdf")
async def send_report_pdf(
    email: str = Form(...),
    file: UploadFile = File(...),
    personnel_name: str = Form(None),  # Add personnel name parameter
    current_user: User = Depends(get_current_user)
):
    """Send pre-generated PDF file via email"""
    try:
        print(f"[UPLOAD] Received file: {file.filename}, type: {file.content_type}")
        print(f"[UPLOAD] Personnel name: {personnel_name}")  # Debug log
        
        # Validate file type
        if file.content_type not in ["application/pdf", "application/octet-stream"]:
            raise HTTPException(400, f"File must be a PDF, got {file.content_type}")
        
        # Read file contents
        pdf_bytes = await file.read()
        
        if len(pdf_bytes) == 0:
            raise HTTPException(400, "Empty PDF file received")
        
        print(f"[UPLOAD] PDF size: {len(pdf_bytes)} bytes ({len(pdf_bytes)/1024/1024:.2f} MB)")
        
        # STRICT SIZE CHECK - Render free tier limit is ~5MB
        MAX_SIZE = 4 * 1024 * 1024  # 4MB max to be safe
        if len(pdf_bytes) > MAX_SIZE:
            raise HTTPException(
                413, 
                f"PDF too large: {len(pdf_bytes)/1024/1024:.1f}MB. "
                f"Maximum allowed is 4MB. Please download and send manually."
            )
        
        # Send email with personnel name
        success = await send_email_with_pdf(
            email=email, 
            pdf_bytes=pdf_bytes, 
            personnel_name=personnel_name
        )

        if success:
            return {"status": "success", "message": "Email sent successfully"}
        
        raise HTTPException(500, "Email sending failed - check server logs")

    except HTTPException:
        raise
    except Exception as e:
        print("EMAIL ENDPOINT ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(500, detail=str(e))
    finally:
        await file.close()

# CHECK DUPLICATE ENTRY
@app.get("/api/exists/{prefix}/{number}/{year}")
def check_exists(
    prefix: str,
    number: str,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        svc_no = f"{prefix}/{number}".strip("/")
        svc_no = "/".join(part.strip() for part in svc_no.split("/"))
        svc_no = svc_no.upper()

        if not svc_no.startswith("NAF"):
            svc_no = "NAF/" + svc_no.lstrip("/")

        print(f"[EXISTS CHECK] svc_no: '{svc_no}', year: {year}")

        exists = (
            db.query(PFTResult)
            .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
            .first()
            is not None
        )

        return {
            "exists": exists,
            "svc_no": svc_no,
            "year": year
        }

    except Exception as e:
        print("[EXISTS ERROR]", str(e))
        raise HTTPException(status_code=500, detail=str(e))

print("-- MAIN.PY FULLY LOADED --")


#old version
# import os
# import sys
# import traceback
# from datetime import datetime

# print("=== MAIN.PY START ===")
# print("Python version:", sys.version.strip())
# print("Current working dir:", os.getcwd())
# print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

# # Check email env vars at startup
# print("SMTP_USER present?", "yes" if os.getenv("SMTP_USER") else "NO")
# print("EMAIL_FROM present?", "yes" if os.getenv("EMAIL_FROM") else "NO")
# print("SMTP_PASSWORD present?", "yes" if os.getenv("SMTP_PASSWORD") else "NO")
# print("SMTP_HOST:", os.getenv("SMTP_HOST", "not set"))
# print("SMTP_PORT:", os.getenv("SMTP_PORT", "not set"))

# from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, Request, Response
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import IntegrityError

# print("Core imports successful")

# try:
#     from app.routes.fitness import router as fitness_router
#     from app.routes.auth import router as auth_router
#     from app.routes.superadmin import router as superadmin_router
#     from app.services.email_service import send_email_with_pdf
#     from app.services.database import engine, get_db
#     from app.services.models import Base, PFTResult, User
#     from app.schemas import InputSchema
#     from app.services.naf_pft import compute_naf_pft
#     from app.services.auth import require_evaluator, get_current_user, require_admin, clear_session_cookie
#     print("All project imports successful")

# except ImportError as e:
#     print("!!! CRITICAL IMPORT ERROR !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)
#     sys.exit(1)

# app = FastAPI(
#     title="NAF Physical Fitness Test API",
#     description="API for Nigerian Air Force Physical Fitness Test computation and storage",
#     version="2.0.0",
# )

# print("FastAPI app instance created")

# # CORS - Configured with your specific frontend URLs
# DEFAULT_ORIGINS = "http://localhost:5173,https://naf-pft-sys.vercel.app"
# ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
# ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

# print(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=["*"],
#     expose_headers=["*"],
#     max_age=600,
# )

# print("CORS middleware added with credentials support")

# # Register routers
# app.include_router(fitness_router)
# app.include_router(auth_router)
# app.include_router(superadmin_router)

# print("Routers included")

# # Create database tables
# print("Creating database tables...")

# try:
#     Base.metadata.create_all(bind=engine)
#     print("Tables created / already exist")

# except Exception as e:
#     print("!!! FAILED TO CREATE TABLES !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)

# # ROOT ROUTE
# @app.get("/")
# @app.head("/")
# def root():
#     return {"status": "ok", "message": "NAF PFT API is running"}

# # HEALTH CHECK
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "timestamp": datetime.utcnow().isoformat(),
#         "message": "Backend is running"
#     }

# # LOGOUT ENDPOINT
# @app.post("/logout")
# def logout_endpoint(response: Response):
#     clear_session_cookie(response)
#     return {"message": "Logged out successfully"}

# # TEST EMAIL ENDPOINT - Simple test without PDF
# @app.get("/test-email")
# async def test_email():
#     """Test email configuration without sending actual email"""
#     try:
#         from email.message import EmailMessage
#         import aiosmtplib
        
#         smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))
        
#         # Try to connect and authenticate only
#         smtp = aiosmtplib.SMTP(hostname=smtp_host, port=smtp_port)
#         await smtp.connect()
#         await smtp.starttls()
#         await smtp.login(smtp_user, smtp_password)
#         await smtp.quit()
        
#         return {
#             "status": "success",
#             "message": "SMTP connection and authentication successful",
#             "smtp_user": smtp_user,
#             "smtp_host": smtp_host
#         }
        
#     except Exception as e:
#         return {
#             "status": "error",
#             "message": str(e),
#             "error_type": type(e).__name__
#         }

# # SEND EMAIL REPORT - JSON VERSION
# @app.post("/send-report")
# async def send_report(
#     data: dict = Body(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Send PFT report via email (simple text version for testing).
#     """
#     try:
#         email = data.get("email")
#         if not email:
#             raise HTTPException(400, "Email is required")

#         from email.message import EmailMessage
#         import aiosmtplib
        
#         smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))

#         if not smtp_user or not smtp_password:
#             raise HTTPException(500, "SMTP not configured on server")

#         message = EmailMessage()
#         message["From"] = smtp_user
#         message["To"] = email
#         message["Subject"] = "NAF PFT Test Email"
#         message.set_content("This is a test email from NAF PFT system.")

#         await aiosmtplib.send(
#             message,
#             hostname=smtp_host,
#             port=smtp_port,
#             username=smtp_user,
#             password=smtp_password,
#             start_tls=True
#         )

#         return {"status": "success", "message": "Test email sent"}

#     except Exception as e:
#         print("EMAIL ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# # SEND REPORT PDF - FILE UPLOAD VERSION
# @app.post("/send-report-pdf")
# async def send_report_pdf(
#     email: str = Form(...),
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """Send pre-generated PDF file via email"""
#     try:
#         print(f"[UPLOAD] Received file: {file.filename}, type: {file.content_type}")
        
#         # Validate file type
#         if file.content_type not in ["application/pdf", "application/octet-stream"]:
#             raise HTTPException(400, f"File must be a PDF, got {file.content_type}")
        
#         # Read file contents
#         pdf_bytes = await file.read()
        
#         if len(pdf_bytes) == 0:
#             raise HTTPException(400, "Empty PDF file received")
        
#         print(f"[UPLOAD] PDF size: {len(pdf_bytes)} bytes ({len(pdf_bytes)/1024/1024:.2f} MB)")
        
#         # STRICT SIZE CHECK - Render free tier limit is ~5MB
#         MAX_SIZE = 4 * 1024 * 1024  # 4MB max to be safe
#         if len(pdf_bytes) > MAX_SIZE:
#             raise HTTPException(
#                 413, 
#                 f"PDF too large: {len(pdf_bytes)/1024/1024:.1f}MB. "
#                 f"Maximum allowed is 4MB. Please download and send manually."
#             )
        
#         success = await send_email_with_pdf(email=email, pdf_bytes=pdf_bytes)

#         if success:
#             return {"status": "success", "message": "Email sent successfully"}
        
#         raise HTTPException(500, "Email sending failed - check server logs")

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("EMAIL ENDPOINT ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(500, detail=str(e))
#     finally:
#         await file.close()

# # CHECK DUPLICATE ENTRY
# @app.get("/api/exists/{prefix}/{number}/{year}")
# def check_exists(
#     prefix: str,
#     number: str,
#     year: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     try:
#         svc_no = f"{prefix}/{number}".strip("/")
#         svc_no = "/".join(part.strip() for part in svc_no.split("/"))
#         svc_no = svc_no.upper()

#         if not svc_no.startswith("NAF"):
#             svc_no = "NAF/" + svc_no.lstrip("/")

#         print(f"[EXISTS CHECK] svc_no: '{svc_no}', year: {year}")

#         exists = (
#             db.query(PFTResult)
#             .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
#             .first()
#             is not None
#         )

#         return {
#             "exists": exists,
#             "svc_no": svc_no,
#             "year": year
#         }

#     except Exception as e:
#         print("[EXISTS ERROR]", str(e))
#         raise HTTPException(status_code=500, detail=str(e))

# print("-- MAIN.PY FULLY LOADED --")



#====old email code===
# import os
# import sys
# import traceback
# from datetime import datetime

# print("=== MAIN.PY START ===")
# print("Python version:", sys.version.strip())
# print("Current working dir:", os.getcwd())
# print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

# # Check email env vars at startup
# print("SMTP_USER present?", "yes" if os.getenv("SMTP_USER") else "NO")
# print("EMAIL_FROM present?", "yes" if os.getenv("EMAIL_FROM") else "NO")
# print("SMTP_PASSWORD present?", "yes" if os.getenv("SMTP_PASSWORD") else "NO")
# print("SMTP_HOST:", os.getenv("SMTP_HOST", "not set"))
# print("SMTP_PORT:", os.getenv("SMTP_PORT", "not set"))

# from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, Request, Response
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import IntegrityError

# print("Core imports successful")

# try:
#     from app.routes.fitness import router as fitness_router
#     from app.routes.auth import router as auth_router
#     from app.routes.superadmin import router as superadmin_router
#     from app.services.email_service import send_email_with_pdf
#     from app.services.database import engine, get_db
#     from app.services.models import Base, PFTResult, User
#     from app.schemas import InputSchema
#     from app.services.naf_pft import compute_naf_pft
#     from app.services.auth import require_evaluator, get_current_user, require_admin, clear_session_cookie
#     print("All project imports successful")

# except ImportError as e:
#     print("!!! CRITICAL IMPORT ERROR !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)
#     sys.exit(1)

# app = FastAPI(
#     title="NAF Physical Fitness Test API",
#     description="API for Nigerian Air Force Physical Fitness Test computation and storage",
#     version="2.0.0",
# )

# print("FastAPI app instance created")

# # CORS - Configured with your specific frontend URLs
# DEFAULT_ORIGINS = "http://localhost:5173,https://naf-pft-sys.vercel.app"
# ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
# ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

# print(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=["*"],
#     expose_headers=["*"],
#     max_age=600,
# )

# print("CORS middleware added with credentials support")

# # Register routers
# app.include_router(fitness_router)
# app.include_router(auth_router)
# app.include_router(superadmin_router)

# print("Routers included")

# # Create database tables
# print("Creating database tables...")

# try:
#     Base.metadata.create_all(bind=engine)
#     print("Tables created / already exist")

# except Exception as e:
#     print("!!! FAILED TO CREATE TABLES !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)

# # ROOT ROUTE
# @app.get("/")
# @app.head("/")
# def root():
#     return {"status": "ok", "message": "NAF PFT API is running"}

# # HEALTH CHECK
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "timestamp": datetime.utcnow().isoformat(),
#         "message": "Backend is running"
#     }

# # LOGOUT ENDPOINT
# @app.post("/logout")
# def logout_endpoint(response: Response):
#     clear_session_cookie(response)
#     return {"message": "Logged out successfully"}

# # TEST EMAIL ENDPOINT - Simple test without PDF
# @app.get("/test-email")
# async def test_email():
#     """Test email configuration without sending actual email"""
#     try:
#         from email.message import EmailMessage
#         import aiosmtplib
        
#         smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))
        
#         # Try to connect and authenticate only
#         smtp = aiosmtplib.SMTP(hostname=smtp_host, port=smtp_port)
#         await smtp.connect()
#         await smtp.starttls()
#         await smtp.login(smtp_user, smtp_password)
#         await smtp.quit()
        
#         return {
#             "status": "success",
#             "message": "SMTP connection and authentication successful",
#             "smtp_user": smtp_user,
#             "smtp_host": smtp_host
#         }
        
#     except Exception as e:
#         return {
#             "status": "error",
#             "message": str(e),
#             "error_type": type(e).__name__
#         }

# # SEND EMAIL REPORT - JSON VERSION
# @app.post("/send-report")
# async def send_report(
#     data: dict = Body(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Send PFT report via email (simple text version for testing).
#     """
#     try:
#         email = data.get("email")
#         if not email:
#             raise HTTPException(400, "Email is required")

#         from email.message import EmailMessage
#         import aiosmtplib
        
#         smtp_user = os.getenv("SMTP_USER") or os.getenv("EMAIL_FROM")
#         smtp_password = os.getenv("SMTP_PASSWORD")
#         smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
#         smtp_port = int(os.getenv("SMTP_PORT", 587))

#         if not smtp_user or not smtp_password:
#             raise HTTPException(500, "SMTP not configured on server")

#         message = EmailMessage()
#         message["From"] = smtp_user
#         message["To"] = email
#         message["Subject"] = "NAF PFT Test Email"
#         message.set_content("This is a test email from NAF PFT system.")

#         await aiosmtplib.send(
#             message,
#             hostname=smtp_host,
#             port=smtp_port,
#             username=smtp_user,
#             password=smtp_password,
#             start_tls=True
#         )

#         return {"status": "success", "message": "Test email sent"}

#     except Exception as e:
#         print("EMAIL ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# # SEND REPORT PDF - FILE UPLOAD VERSION
# @app.post("/send-report-pdf")
# async def send_report_pdf(
#     email: str = Form(...),
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """Send pre-generated PDF file via email"""
#     try:
#         print(f"[UPLOAD] Received file: {file.filename}, type: {file.content_type}")
        
#         # Validate file type
#         if file.content_type not in ["application/pdf", "application/octet-stream"]:
#             raise HTTPException(400, f"File must be a PDF, got {file.content_type}")
        
#         # Read file contents
#         pdf_bytes = await file.read()
        
#         if len(pdf_bytes) == 0:
#             raise HTTPException(400, "Empty PDF file received")
        
#         print(f"[UPLOAD] PDF size: {len(pdf_bytes)} bytes")
        
#         # Check if PDF is too large (Gmail limit ~25MB)
#         if len(pdf_bytes) > 25 * 1024 * 1024:
#             raise HTTPException(400, "PDF too large (max 25MB for email)")
        
#         success = await send_email_with_pdf(email=email, pdf_bytes=pdf_bytes)

#         if success:
#             return {"status": "success", "message": "Email sent successfully"}
        
#         raise HTTPException(500, "Email sending failed - check server logs for details")

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("EMAIL ENDPOINT ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(500, detail=str(e))
#     finally:
#         await file.close()

# # CHECK DUPLICATE ENTRY
# @app.get("/api/exists/{prefix}/{number}/{year}")
# def check_exists(
#     prefix: str,
#     number: str,
#     year: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     try:
#         svc_no = f"{prefix}/{number}".strip("/")
#         svc_no = "/".join(part.strip() for part in svc_no.split("/"))
#         svc_no = svc_no.upper()

#         if not svc_no.startswith("NAF"):
#             svc_no = "NAF/" + svc_no.lstrip("/")

#         print(f"[EXISTS CHECK] svc_no: '{svc_no}', year: {year}")

#         exists = (
#             db.query(PFTResult)
#             .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
#             .first()
#             is not None
#         )

#         return {
#             "exists": exists,
#             "svc_no": svc_no,
#             "year": year
#         }

#     except Exception as e:
#         print("[EXISTS ERROR]", str(e))
#         raise HTTPException(status_code=500, detail=str(e))

# print("-- MAIN.PY FULLY LOADED --")


# import os
# import sys
# import traceback
# from datetime import datetime

# print("=== MAIN.PY START ===")
# print("Python version:", sys.version.strip())
# print("Current working dir:", os.getcwd())
# print("DATABASE_URL present?", "yes" if os.getenv("DATABASE_URL") else "NO - MISSING!")

# from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Body, Request, Response
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import IntegrityError

# print("Core imports successful")

# try:
#     from app.routes.fitness import router as fitness_router
#     from app.routes.auth import router as auth_router
#     from app.routes.superadmin import router as superadmin_router
#     from app.services.email_service import send_email_with_pdf
#     from app.services.database import engine, get_db
#     from app.services.models import Base, PFTResult, User
#     from app.schemas import InputSchema
#     from app.services.naf_pft import compute_naf_pft
#     from app.services.auth import require_evaluator, get_current_user, require_admin, clear_session_cookie
#     print("All project imports successful")

# except ImportError as e:
#     print("!!! CRITICAL IMPORT ERROR !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)
#     sys.exit(1)

# app = FastAPI(
#     title="NAF Physical Fitness Test API",
#     description="API for Nigerian Air Force Physical Fitness Test computation and storage",
#     version="2.0.0",
# )

# print("FastAPI app instance created")

# # CORS - Configured with your specific frontend URLs
# # Set ALLOWED_ORIGINS env var for additional origins, defaults to your known URLs
# DEFAULT_ORIGINS = "http://localhost:5173,https://naf-pft-sys.vercel.app"
# ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
# ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

# print(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ALLOWED_ORIGINS,  # Specific origins, not "*"
#     allow_credentials=True,  # Required for cookies
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=["*"],
#     expose_headers=["*"],
#     max_age=600,  # Cache preflight requests for 10 minutes
# )

# print("CORS middleware added with credentials support")

# # Register routers
# app.include_router(fitness_router)
# app.include_router(auth_router)
# app.include_router(superadmin_router)

# print("Routers included")

# # Create database tables
# print("Creating database tables...")

# try:
#     Base.metadata.create_all(bind=engine)
#     print("Tables created / already exist")

# except Exception as e:
#     print("!!! FAILED TO CREATE TABLES !!!")
#     print("Error:", str(e))
#     traceback.print_exc(file=sys.stdout)

# # ROOT ROUTE
# @app.get("/")
# @app.head("/")
# def root():
#     return {"status": "ok", "message": "NAF PFT API is running"}

# # HEALTH CHECK
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "timestamp": datetime.utcnow().isoformat(),
#         "message": "Backend is running"
#     }

# # LOGOUT ENDPOINT
# @app.post("/logout")
# def logout_endpoint(response: Response):
#     clear_session_cookie(response)
#     return {"message": "Logged out successfully"}

# # SEND EMAIL REPORT - JSON VERSION
# @app.post("/send-report")
# async def send_report(
#     data: dict = Body(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Send PFT report via email.
#     Expects JSON: { "email": "user@example.com", "report_data": {...} }
#     """
#     try:
#         email = data.get("email")
#         report_data = data.get("report_data")
 
#         if not email or not report_data:
#             raise HTTPException(400, "Email and report_data are required")

#         success = await send_email_with_pdf(
#             email=email,
#             report_data=report_data
#         )

#         if success:
#             return {
#                 "status": "success",
#                 "message": "Email sent successfully"
#             }

#         raise HTTPException(
#             status_code=500,
#             detail="Email sending failed"
#         )

#     except Exception as e:
#         print("EMAIL ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(
#             status_code=500,
#             detail=str(e)
#         )

# # Alternative endpoint for file upload
# @app.post("/send-report-pdf")
# async def send_report_pdf(
#     email: str = Form(...),
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user)
# ):
#     """Send pre-generated PDF file via email"""
#     try:
#         pdf_bytes = await file.read()
#         success = await send_email_with_pdf(email=email, pdf_bytes=pdf_bytes)

#         if success:
#             return {"status": "success", "message": "Email sent successfully"}
#         raise HTTPException(500, "Email sending failed")

#     except Exception as e:
#         print("EMAIL ERROR:", str(e))
#         traceback.print_exc()
#         raise HTTPException(500, detail=str(e))

# # CHECK DUPLICATE ENTRY
# @app.get("/api/exists/{prefix}/{number}/{year}")
# def check_exists(
#     prefix: str,
#     number: str,
#     year: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     try:
#         svc_no = f"{prefix}/{number}".strip("/")
#         svc_no = "/".join(part.strip() for part in svc_no.split("/"))
#         svc_no = svc_no.upper()

#         if not svc_no.startswith("NAF"):
#             svc_no = "NAF/" + svc_no.lstrip("/")

#         print(f"[EXISTS CHECK] svc_no: '{svc_no}', year: {year}")

#         exists = (
#             db.query(PFTResult)
#             .filter(PFTResult.svc_no == svc_no, PFTResult.year == year)
#             .first()
#             is not None
#         )

#         return {
#             "exists": exists,
#             "svc_no": svc_no,
#             "year": year
#         }

#     except Exception as e:
#         print("[EXISTS ERROR]", str(e))
#         raise HTTPException(status_code=500, detail=str(e))

# print("-- MAIN.PY FULLY LOADED --")
