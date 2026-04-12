# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from typing import List, Optional

# from app.schemas import CertificateCreate, CertificateUpdate, CertificateOut, CertificateCheckResponse
# from app.services.database import get_db
# from app.services.models import Certificate, PFTResult, User
# from app.services.auth import get_current_user, require_admin, require_super_admin

# router = APIRouter(prefix="/certificates", tags=["certificates"])

# # Certificate number counter (starting from 54991)
# # In production, you might want to store this in database
# CERT_PREFIX = "NAF/786/HQ"

# def generate_certificate_number(db: Session) -> str:
#     """Generate next certificate number"""
#     # Get the highest existing certificate number
#     last_cert = db.query(Certificate).order_by(Certificate.id.desc()).first()
    
#     if last_cert:
#         # Extract number from last certificate (format: NAF/786/HQ054991)
#         last_num = int(last_cert.certificate_number.split("HQ")[-1])
#         next_num = last_num + 1
#     else:
#         # Start from 54991
#         next_num = 54991
    
#     return f"{CERT_PREFIX}{str(next_num).zfill(6)}"


# # ============ CREATE CERTIFICATE ============
# @router.post("/", response_model=CertificateOut)
# def create_certificate(
#     cert_data: CertificateCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Create a new certificate for a PFT result (Admin or Super Admin only)"""
    
#     # Check if PFT result exists
#     pft_result = db.query(PFTResult).filter(PFTResult.id == cert_data.pft_result_id).first()
#     if not pft_result:
#         raise HTTPException(status_code=404, detail="PFT result not found")
    
#     # Check if certificate already exists for this PFT result
#     existing = db.query(Certificate).filter(
#         Certificate.pft_result_id == cert_data.pft_result_id
#     ).first()
    
#     if existing:
#         raise HTTPException(
#             status_code=409, 
#             detail=f"Certificate already exists for this PFT result: {existing.certificate_number}"
#         )
    
#     # Generate certificate number
#     cert_number = generate_certificate_number(db)
    
#     # Create certificate
#     new_cert = Certificate(
#         certificate_number=cert_number,
#         pft_result_id=cert_data.pft_result_id,
#         personnel_name=pft_result.full_name,
#         personnel_rank=pft_result.rank,
#         personnel_svc_no=pft_result.svc_no,
#         personnel_unit=pft_result.unit,
#         participated_in=cert_data.participated_in,
#         status=cert_data.status,
#         location=cert_data.location,
#         issued_day=cert_data.issued_day,
#         issued_month=cert_data.issued_month,
#         issued_year=cert_data.issued_year,
#         issued_by=current_user.id,
#         issuer_name=current_user.full_name,
#         issuer_rank=current_user.rank
#     )
    
#     db.add(new_cert)
#     db.commit()
#     db.refresh(new_cert)
    
#     return {
#         **new_cert.__dict__,
#         'created_at': new_cert.created_at.isoformat() if new_cert.created_at else None
#     }


# # ============ GET ALL CERTIFICATES (Super Admin only) ============
# @router.get("/", response_model=List[CertificateOut])
# def get_all_certificates(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Get all certificates (Super Admin only)"""
#     certs = db.query(Certificate).order_by(Certificate.created_at.desc()).all()
    
#     return [
#         {
#             **cert.__dict__,
#             'created_at': cert.created_at.isoformat() if cert.created_at else None
#         }
#         for cert in certs
#     ]


# # ============ GET CERTIFICATE BY ID ============
# @router.get("/{cert_id}", response_model=CertificateOut)
# def get_certificate(
#     cert_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Get a specific certificate by ID"""
#     cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
#     if not cert:
#         raise HTTPException(status_code=404, detail="Certificate not found")
    
#     return {
#         **cert.__dict__,
#         'created_at': cert.created_at.isoformat() if cert.created_at else None
#     }


# # ============ GET CERTIFICATE BY PFT RESULT ID ============
# @router.get("/pft/{pft_result_id}", response_model=CertificateOut)
# def get_certificate_by_pft(
#     pft_result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Get certificate by PFT result ID"""
#     cert = db.query(Certificate).filter(
#         Certificate.pft_result_id == pft_result_id
#     ).first()
    
#     if not cert:
#         raise HTTPException(status_code=404, detail="Certificate not found for this PFT result")
    
#     return {
#         **cert.__dict__,
#         'created_at': cert.created_at.isoformat() if cert.created_at else None
#     }


# # ============ CHECK IF CERTIFICATE EXISTS ============
# @router.get("/check/{pft_result_id}", response_model=CertificateCheckResponse)
# def check_certificate_exists(
#     pft_result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Check if a certificate exists for a PFT result"""
#     cert = db.query(Certificate).filter(
#         Certificate.pft_result_id == pft_result_id
#     ).first()
    
#     if cert:
#         return CertificateCheckResponse(
#             exists=True,
#             certificate_id=cert.id,
#             certificate_number=cert.certificate_number
#         )
    
#     return CertificateCheckResponse(exists=False)


# # ============ UPDATE CERTIFICATE ============
# @router.put("/{cert_id}", response_model=CertificateOut)
# def update_certificate(
#     cert_id: int,
#     cert_data: CertificateUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_admin)
# ):
#     """Update a certificate (only issuer or super admin can update)"""
#     cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
#     if not cert:
#         raise HTTPException(status_code=404, detail="Certificate not found")
    
#     # Only issuer or super admin can update
#     if current_user.role != "super_admin" and cert.issued_by != current_user.id:
#         raise HTTPException(status_code=403, detail="Only the issuer or super admin can update this certificate")
    
#     # Update fields
#     update_data = cert_data.model_dump(exclude_unset=True)
#     for field, value in update_data.items():
#         setattr(cert, field, value)
    
#     db.commit()
#     db.refresh(cert)
    
#     return {
#         **cert.__dict__,
#         'created_at': cert.created_at.isoformat() if cert.created_at else None
#     }


# # ============ DELETE CERTIFICATE (Super Admin only) ============
# @router.delete("/{cert_id}")
# def delete_certificate(
#     cert_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Delete a certificate (Super Admin only)"""
#     cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
#     if not cert:
#         raise HTTPException(status_code=404, detail="Certificate not found")
    
#     db.delete(cert)
#     db.commit()
    
#     return {"message": f"Certificate {cert.certificate_number} deleted successfully"}


# # ============ GET CERTIFICATES BY ISSUER (for Admin Details page) ============
# @router.get("/issuer/{admin_id}", response_model=List[CertificateOut])
# def get_certificates_by_issuer(
#     admin_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Get all certificates issued by a specific admin (Super Admin only)"""
#     certs = db.query(Certificate).filter(
#         Certificate.issued_by == admin_id
#     ).order_by(Certificate.created_at.desc()).all()
    
#     return [
#         {
#             **cert.__dict__,
#             'created_at': cert.created_at.isoformat() if cert.created_at else None
#         }
#         for cert in certs
#     ]


# # ============ GET CERTIFICATE COUNT FOR ADMIN ============
# @router.get("/count/{admin_id}")
# def get_certificate_count(
#     admin_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Get count of certificates issued by an admin"""
#     count = db.query(func.count(Certificate.id)).filter(
#         Certificate.issued_by == admin_id
#     ).scalar()
    
#     return {"admin_id": admin_id, "certificates_count": count}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.schemas import CertificateCreate, CertificateUpdate, CertificateOut, CertificateCheckResponse
from app.services.database import get_db
from app.services.models import Certificate, PFTResult, User
from app.services.auth import get_current_user, require_admin, require_super_admin

router = APIRouter(prefix="/certificates", tags=["certificates"])

# Certificate number counter (starting from 54991)
CERT_PREFIX = "NAF/786/HQ"

def generate_certificate_number(db: Session) -> str:
    """Generate next certificate number"""
    # Get the highest existing certificate number
    last_cert = db.query(Certificate).order_by(Certificate.id.desc()).first()
    
    if last_cert:
        # Extract number from last certificate (format: NAF/786/HQ054991)
        last_num = int(last_cert.certificate_number.split("HQ")[-1])
        next_num = last_num + 1
    else:
        # Start from 54991
        next_num = 54991
    
    return f"{CERT_PREFIX}{str(next_num).zfill(6)}"


# ============ GET NEXT CERTIFICATE NUMBER ============
@router.get("/next-number", response_model=dict)
def get_next_certificate_number(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get the next available certificate number without creating a certificate"""
    next_number = generate_certificate_number(db)
    return {
        "next_certificate_number": next_number,
        "number_part": next_number.split("HQ")[-1]
    }


# ============ CREATE CERTIFICATE ============
@router.post("/", response_model=CertificateOut)
def create_certificate(
    cert_data: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new certificate for a PFT result (Admin or Super Admin only)"""
    
    # Check if PFT result exists
    pft_result = db.query(PFTResult).filter(PFTResult.id == cert_data.pft_result_id).first()
    if not pft_result:
        raise HTTPException(status_code=404, detail="PFT result not found")
    
    # Check if certificate already exists for this PFT result
    existing = db.query(Certificate).filter(
        Certificate.pft_result_id == cert_data.pft_result_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409, 
            detail=f"Certificate already exists for this PFT result: {existing.certificate_number}"
        )
    
    # Generate certificate number
    cert_number = generate_certificate_number(db)
    
    # Create certificate
    new_cert = Certificate(
        certificate_number=cert_number,
        pft_result_id=cert_data.pft_result_id,
        personnel_name=pft_result.full_name,
        personnel_rank=pft_result.rank,
        personnel_svc_no=pft_result.svc_no,
        personnel_unit=pft_result.unit,
        participated_in=cert_data.participated_in,
        status=cert_data.status,
        location=cert_data.location,
        issued_day=cert_data.issued_day,
        issued_month=cert_data.issued_month,
        issued_year=cert_data.issued_year,
        issued_by=current_user.id,
        issuer_name=current_user.full_name,
        issuer_rank=current_user.rank
    )
    
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    
    return {
        **new_cert.__dict__,
        'created_at': new_cert.created_at.isoformat() if new_cert.created_at else None
    }


# ============ GET ALL CERTIFICATES (Super Admin only) ============
@router.get("/", response_model=List[CertificateOut])
def get_all_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all certificates (Super Admin only)"""
    certs = db.query(Certificate).order_by(Certificate.created_at.desc()).all()
    
    return [
        {
            **cert.__dict__,
            'created_at': cert.created_at.isoformat() if cert.created_at else None
        }
        for cert in certs
    ]


# ============ GET CERTIFICATE BY ID ============
@router.get("/{cert_id}", response_model=CertificateOut)
def get_certificate(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific certificate by ID"""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return {
        **cert.__dict__,
        'created_at': cert.created_at.isoformat() if cert.created_at else None
    }


# ============ GET CERTIFICATE BY PFT RESULT ID ============
@router.get("/pft/{pft_result_id}", response_model=CertificateOut)
def get_certificate_by_pft(
    pft_result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get certificate by PFT result ID"""
    cert = db.query(Certificate).filter(
        Certificate.pft_result_id == pft_result_id
    ).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found for this PFT result")
    
    return {
        **cert.__dict__,
        'created_at': cert.created_at.isoformat() if cert.created_at else None
    }


# ============ CHECK IF CERTIFICATE EXISTS ============
@router.get("/check/{pft_result_id}", response_model=CertificateCheckResponse)
def check_certificate_exists(
    pft_result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a certificate exists for a PFT result"""
    cert = db.query(Certificate).filter(
        Certificate.pft_result_id == pft_result_id
    ).first()
    
    if cert:
        return CertificateCheckResponse(
            exists=True,
            certificate_id=cert.id,
            certificate_number=cert.certificate_number
        )
    
    return CertificateCheckResponse(exists=False)


# ============ UPDATE CERTIFICATE ============
@router.put("/{cert_id}", response_model=CertificateOut)
def update_certificate(
    cert_id: int,
    cert_data: CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a certificate (only issuer or super admin can update)"""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Only issuer or super admin can update
    if current_user.role != "super_admin" and cert.issued_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the issuer or super admin can update this certificate")
    
    # Update fields
    update_data = cert_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cert, field, value)
    
    db.commit()
    db.refresh(cert)
    
    return {
        **cert.__dict__,
        'created_at': cert.created_at.isoformat() if cert.created_at else None
    }


# ============ DELETE CERTIFICATE (Super Admin only) ============
@router.delete("/{cert_id}")
def delete_certificate(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Delete a certificate (Super Admin only)"""
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    db.delete(cert)
    db.commit()
    
    return {"message": f"Certificate {cert.certificate_number} deleted successfully"}


# ============ GET CERTIFICATES BY ISSUER (for Admin Details page) ============
@router.get("/issuer/{admin_id}", response_model=List[CertificateOut])
def get_certificates_by_issuer(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all certificates issued by a specific admin (Super Admin only)"""
    certs = db.query(Certificate).filter(
        Certificate.issued_by == admin_id
    ).order_by(Certificate.created_at.desc()).all()
    
    return [
        {
            **cert.__dict__,
            'created_at': cert.created_at.isoformat() if cert.created_at else None
        }
        for cert in certs
    ]


# ============ GET CERTIFICATE COUNT FOR ADMIN ============
@router.get("/count/{admin_id}")
def get_certificate_count(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get count of certificates issued by an admin"""
    count = db.query(func.count(Certificate.id)).filter(
        Certificate.issued_by == admin_id
    ).scalar()
    
    return {"admin_id": admin_id, "certificates_count": count}