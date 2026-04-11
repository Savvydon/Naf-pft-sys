from pydantic import BaseModel
from typing import Optional

# PFT INPUT SCHEMA (Evaluator Form Submission)
class InputSchema(BaseModel):
    year: int
    full_name: str
    rank: str
    svc_no: str
    unit: str

    email: Optional[str] = None
    appointment: str
    date: str

    age: int
    sex: str

    height: float
    weight: float

    cardio_cage: int

    step_up: int
    push_up: int
    sit_up: int
    chin_up: int

    sit_reach: int

    # evaluator_name and evaluator_rank intentionally excluded
    # backend automatically attaches them from authenticated user

# ADMIN UPDATE SCHEMA
class PFTUpdate(BaseModel):
    year: Optional[int] = None
    full_name: Optional[str] = None
    rank: Optional[str] = None
    svc_no: Optional[str] = None
    unit: Optional[str] = None

    email: Optional[str] = None
    appointment: Optional[str] = None
    date: Optional[str] = None

    age: Optional[int] = None
    sex: Optional[str] = None

    height: Optional[float] = None
    weight: Optional[float] = None

    cardio_cage: Optional[int] = None

    step_up: Optional[int] = None
    push_up: Optional[int] = None
    sit_up: Optional[int] = None
    chin_up: Optional[int] = None

    sit_reach: Optional[int] = None

    evaluator_name: Optional[str] = None
    evaluator_rank: Optional[str] = None

    notes: Optional[str] = None


# USER REGISTRATION SCHEMA (SELF REGISTRATION)
class UserRegister(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str

    # email optional
    email: Optional[str] = None


# AUTHENTICATION SCHEMAS
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    rank: str

class TokenData(BaseModel):
    svc_no: Optional[str] = None


# LOGIN SCHEMA
class UserLogin(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str


# USER RESPONSE SCHEMA
class UserOut(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    role: str
    email: Optional[str] = None
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True


# ==================== CERTIFICATE SCHEMAS ====================

class CertificateCreate(BaseModel):
    pft_result_id: int
    participated_in: str
    status: str  # Fit, Not Fit, Excused
    location: str
    issued_day: str
    issued_month: str
    issued_year: str


class CertificateUpdate(BaseModel):
    participated_in: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    issued_day: Optional[str] = None
    issued_month: Optional[str] = None
    issued_year: Optional[str] = None
    aoc_signatory: Optional[str] = None
    sports_officer_signatory: Optional[str] = None


class CertificateOut(BaseModel):
    id: int
    certificate_number: str
    pft_result_id: int
    personnel_name: str
    personnel_rank: str
    personnel_svc_no: str
    personnel_unit: str
    participated_in: str
    status: str
    location: str
    issued_day: str
    issued_month: str
    issued_year: str
    issued_by: int
    issuer_name: str
    issuer_rank: str
    aoc_signatory: Optional[str] = None
    sports_officer_signatory: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class CertificateCheckResponse(BaseModel):
    exists: bool
    certificate_id: Optional[int] = None
    certificate_number: Optional[str] = None


class CertificateListItem(BaseModel):
    """Simplified certificate info for list views"""
    id: int
    certificate_number: str
    personnel_name: str
    personnel_svc_no: str
    personnel_rank: str
    personnel_unit: str
    status: str
    created_at: Optional[str] = None


class AdminCertificatesResponse(BaseModel):
    """Response for admin details page"""
    admin: UserOut
    certificates_count: int
    certificates: list[CertificateListItem]