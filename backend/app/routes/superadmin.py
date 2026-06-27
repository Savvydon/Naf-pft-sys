# from fastapi import APIRouter, Depends, HTTPException, status, Response
# from sqlalchemy.orm import Session
# from sqlalchemy import func, select
# from app.services.database import get_db
# from app.services.models import User, PFTResult
# from app.services.auth import require_super_admin, get_password_hash, set_session_cookie
# from pydantic import BaseModel
# from typing import List, Optional

# router = APIRouter(prefix="/superadmin", tags=["superadmin"])

# # ---------- CONFIGURATION ----------
# SUPERADMIN_SVC_NO = "NAF09/23345"
# SUPERADMIN_PASSWORD = "Super-Admin2026"

# # ---------- SCHEMAS ----------
# class UserCreate(BaseModel):
#     svc_no: str
#     full_name: str
#     rank: str
#     password: str
#     role: str
#     assigned_admin_id: Optional[int] = None  # ← NEW: For direct assignment during creation

# class UserOut(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     role: str
#     assigned_admin_id: Optional[int] = None
#     created_at: Optional[str] = None

#     class Config:
#         from_attributes = True

# class EvaluatorWithCount(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     assigned_admin_id: Optional[int] = None
#     assigned_admin_name: Optional[str] = None
#     evaluations_count: int

# class AssignEvaluatorRequest(BaseModel):
#     evaluator_id: int
#     admin_id: int

# # ---------- HELPER: Convert User to dict with string datetime ----------
# def user_to_dict(user: User) -> dict:
#     """Convert User model to dict with ISO format datetime string"""
#     return {
#         "id": user.id,
#         "svc_no": user.svc_no,
#         "full_name": user.full_name,
#         "rank": user.rank,
#         "role": user.role,
#         "assigned_admin_id": user.assigned_admin_id,
#         "created_at": user.created_at.isoformat() if user.created_at else None
#     }

# # ---------- STATIC SUPER ADMIN LOGIN ----------
# @router.post("/login")
# def superadmin_login(response: Response, credentials: dict, db: Session = Depends(get_db)):
#     """
#     Static login for super admin only.
#     Credentials: NAF09/23345 / Super-Admin2026
#     """
#     svc_no = credentials.get("svc_no", "").strip().upper()
#     password = credentials.get("password", "")

#     svc_no = svc_no.replace("//", "/").strip()

#     if svc_no != SUPERADMIN_SVC_NO.upper() or password != SUPERADMIN_PASSWORD:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid super admin credentials"
#         )

#     super_admin = db.query(User).filter(User.svc_no == SUPERADMIN_SVC_NO.upper()).first()

#     if not super_admin:
#         super_admin = User(
#             svc_no=SUPERADMIN_SVC_NO.upper(),
#             full_name="Super Administrator",
#             rank="System Administrator",
#             hashed_password=get_password_hash(SUPERADMIN_PASSWORD),
#             role="super_admin"
#         )
#         db.add(super_admin)
#         db.commit()
#         db.refresh(super_admin)
#         print(f"[SUPER ADMIN] Created new super admin: {SUPERADMIN_SVC_NO}")

#     from app.services.auth import create_access_token
#     access_token = create_access_token(data={"sub": super_admin.svc_no})

#     # Set HTTP-only cookie
#     set_session_cookie(response, access_token)

#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "role": "super_admin",
#         "full_name": super_admin.full_name,
#         "rank": super_admin.rank
#     }

# # ---------- CREATE EVALUATOR (with optional admin assignment) ----------
# @router.post("/evaluators", response_model=UserOut)
# def create_evaluator(
#     user_data: UserCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     if user_data.role != "evaluator":
#         raise HTTPException(400, "Role must be 'evaluator' for this endpoint")

#     svc_no = user_data.svc_no.upper().strip()

#     existing = db.query(User).filter(User.svc_no == svc_no).first()
#     if existing:
#         raise HTTPException(
#             409,
#             f"Service number '{svc_no}' already registered as {existing.role}"
#         )

#     # ← NEW: Validate assigned_admin_id if provided
#     if user_data.assigned_admin_id:
#         admin = db.query(User).filter(
#             User.id == user_data.assigned_admin_id,
#             User.role == "admin"
#         ).first()
#         if not admin:
#             raise HTTPException(404, "Selected admin not found")

#     new_user = User(
#         svc_no=svc_no,
#         full_name=user_data.full_name.strip(),
#         rank=user_data.rank.strip(),
#         hashed_password=get_password_hash(user_data.password),
#         role="evaluator",
#         assigned_admin_id=user_data.assigned_admin_id  # ← NEW
#     )
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return user_to_dict(new_user)

# # ---------- CREATE ADMIN ----------
# @router.post("/admins", response_model=UserOut)
# def create_admin(
#     user_data: UserCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     if user_data.role != "admin":
#         raise HTTPException(400, "Role must be 'admin' for this endpoint")

#     svc_no = user_data.svc_no.upper().strip()

#     existing = db.query(User).filter(User.svc_no == svc_no).first()
#     if existing:
#         raise HTTPException(
#             409,
#             f"Service number '{svc_no}' already registered as {existing.role}"
#         )

#     new_user = User(
#         svc_no=svc_no,
#         full_name=user_data.full_name.strip(),
#         rank=user_data.rank.strip(),
#         hashed_password=get_password_hash(user_data.password),
#         role="admin"
#     )
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return user_to_dict(new_user)

# # ---------- ASSIGN EVALUATOR TO ADMIN ----------
# @router.post("/assign-evaluator")
# def assign_evaluator_to_admin(
#     data: AssignEvaluatorRequest,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Assign an evaluator to an admin."""
#     evaluator = db.query(User).filter(
#         User.id == data.evaluator_id,
#         User.role == "evaluator"
#     ).first()

#     if not evaluator:
#         raise HTTPException(404, "Evaluator not found")

#     admin = db.query(User).filter(
#         User.id == data.admin_id,
#         User.role == "admin"
#     ).first()

#     if not admin:
#         raise HTTPException(404, "Admin not found")

#     evaluator.assigned_admin_id = data.admin_id
#     db.commit()
#     db.refresh(evaluator)

#     return {
#         "message": f"Evaluator {evaluator.full_name} assigned to Admin {admin.full_name}",
#         "evaluator": user_to_dict(evaluator),
#         "admin": user_to_dict(admin)
#     }

# # ---------- REMOVE EVALUATOR FROM ADMIN ----------
# @router.post("/unassign-evaluator/{evaluator_id}")
# def unassign_evaluator(
#     evaluator_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Remove evaluator from admin assignment."""
#     evaluator = db.query(User).filter(
#         User.id == evaluator_id,
#         User.role == "evaluator"
#     ).first()

#     if not evaluator:
#         raise HTTPException(404, "Evaluator not found")

#     evaluator.assigned_admin_id = None
#     db.commit()
#     db.refresh(evaluator)

#     return {
#         "message": f"Evaluator {evaluator.full_name} unassigned",
#         "evaluator": user_to_dict(evaluator)
#     }

# # ---------- LIST EVALUATORS WITH EVALUATION COUNTS ----------
# @router.get("/evaluators", response_model=List[EvaluatorWithCount])
# def get_evaluators(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     results = db.query(
#         User,
#         func.count(PFTResult.id).label('eval_count')
#     ).outerjoin(
#         PFTResult,
#         User.id == PFTResult.evaluator_id
#     ).filter(
#         User.role == "evaluator"
#     ).group_by(User.id).all()

#     return [
#         {
#             "id": user.id,
#             "svc_no": user.svc_no,
#             "full_name": user.full_name,
#             "rank": user.rank,
#             "assigned_admin_id": user.assigned_admin_id,
#             "assigned_admin_name": user.admin.full_name if user.admin else None,
#             "evaluations_count": eval_count
#         }
#         for user, eval_count in results
#     ]

# # ---------- LIST ADMINS WITH CERTIFICATE COUNTS ----------
# @router.get("/admins", response_model=List[dict])
# def get_admins(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Get all admins with their certificate counts"""
#     from app.services.models import Certificate

#     admins = db.query(User).filter(User.role == "admin").all()

#     result = []
#     for admin in admins:
#         cert_count = db.query(func.count(Certificate.id)).filter(
#             Certificate.issued_by == admin.id
#         ).scalar()

#         # Count assigned evaluators
#         assigned_count = db.query(func.count(User.id)).filter(
#             User.assigned_admin_id == admin.id,
#             User.role == "evaluator"
#         ).scalar()

#         admin_dict = user_to_dict(admin)
#         admin_dict["certificates_count"] = cert_count
#         admin_dict["assigned_evaluators_count"] = assigned_count
#         result.append(admin_dict)

#     return result

# # ---------- GET SINGLE EVALUATOR DETAILS (FIXED) ----------
# @router.get("/evaluators/{evaluator_id}")
# def get_evaluator_details(
#     evaluator_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     evaluator = db.query(User).filter(
#         User.id == evaluator_id,
#         User.role == "evaluator"
#     ).first()

#     if not evaluator:
#         raise HTTPException(404, "Evaluator not found")

#     evaluations = db.query(PFTResult).filter(
#         PFTResult.evaluator_id == evaluator_id
#     ).order_by(PFTResult.created_at.desc()).all()

#     # FIXED: Manually query the assigned admin instead of relying on lazy relationship
#     assigned_admin = None
#     if evaluator.assigned_admin_id:
#         admin = db.query(User).filter(
#             User.id == evaluator.assigned_admin_id,
#             User.role == "admin"
#         ).first()
#         if admin:
#             assigned_admin = {
#                 "id": admin.id,
#                 "svc_no": admin.svc_no,
#                 "full_name": admin.full_name,
#                 "rank": admin.rank,
#                 "role": admin.role,
#             }

#     return {
#         "evaluator": user_to_dict(evaluator),
#         "assigned_admin": assigned_admin,
#         "evaluations_count": len(evaluations),
#         "evaluations": [
#             {
#                 "id": eval.id,
#                 "svc_no": eval.svc_no,
#                 "full_name": eval.full_name,
#                 "year": eval.year,
#                 "grade": eval.grade,
#                 "created_at": eval.created_at.isoformat() if eval.created_at else None
#             }
#             for eval in evaluations
#         ]
#     }

# # ---------- GET SINGLE ADMIN DETAILS WITH CERTIFICATES ----------
# @router.get("/admins/{admin_id}")
# def get_admin_details(
#     admin_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     """Get admin details with certificates issued"""
#     from app.services.models import Certificate

#     admin = db.query(User).filter(
#         User.id == admin_id,
#         User.role == "admin"
#     ).first()

#     if not admin:
#         raise HTTPException(404, "Admin not found")

#     # Get certificates issued by this admin
#     certificates = db.query(Certificate).filter(
#         Certificate.issued_by == admin_id
#     ).order_by(Certificate.created_at.desc()).all()

#     # Get assigned evaluators
#     assigned_evaluators = db.query(User).filter(
#         User.assigned_admin_id == admin_id,
#         User.role == "evaluator"
#     ).all()

#     return {
#         "admin": user_to_dict(admin),
#         "certificates_count": len(certificates),
#         "certificates": [
#             {
#                 "id": cert.id,
#                 "certificate_number": cert.certificate_number,
#                 "personnel_name": cert.personnel_name,
#                 "personnel_svc_no": cert.personnel_svc_no,
#                 "personnel_rank": cert.personnel_rank,
#                 "personnel_unit": cert.personnel_unit,
#                 "status": cert.status,
#                 "created_at": cert.created_at.isoformat() if cert.created_at else None
#             }
#             for cert in certificates
#         ],
#         "assigned_evaluators": [
#             {
#                 "id": ev.id,
#                 "svc_no": ev.svc_no,
#                 "full_name": ev.full_name,
#                 "rank": ev.rank
#             }
#             for ev in assigned_evaluators
#         ]
#     }

# # ---------- DELETE EVALUATOR ----------
# @router.delete("/evaluators/{evaluator_id}")
# def delete_evaluator(
#     evaluator_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     evaluator = db.query(User).filter(
#         User.id == evaluator_id,
#         User.role == "evaluator"
#     ).first()

#     if not evaluator:
#         raise HTTPException(404, "Evaluator not found")

#     db.delete(evaluator)
#     db.commit()
#     return {"message": f"Evaluator {evaluator.svc_no} deleted successfully"}

# # ---------- DELETE ADMIN ----------
# @router.delete("/admins/{admin_id}")
# def delete_admin(
#     admin_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     admin = db.query(User).filter(
#         User.id == admin_id,
#         User.role == "admin"
#     ).first()

#     if not admin:
#         raise HTTPException(404, "Admin not found")

#     # Unassign all evaluators from this admin first
#     db.query(User).filter(
#         User.assigned_admin_id == admin_id
#     ).update({"assigned_admin_id": None})

#     db.delete(admin)
#     db.commit()
#     return {"message": f"Admin {admin.svc_no} deleted successfully"}

# # ---------- GET ALL PFT RESULTS ----------
# @router.get("/pft-results")
# def get_all_pft_results(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     results = db.query(PFTResult).order_by(PFTResult.created_at.desc()).all()
#     return results

# # ---------- GET SINGLE PFT RESULT ----------
# @router.get("/pft-results/{result_id}")
# def get_pft_result(
#     result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
#     if not result:
#         raise HTTPException(404, "Result not found")
#     return result

# # ---------- UPDATE PFT RESULT ----------
# @router.put("/pft-results/{result_id}")
# def update_pft_result(
#     result_id: int,
#     update_data: dict,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     from app.services.pft_utils import recompute_pft_from_record, apply_computed_fields_to_record

#     # Get record with lock
#     stmt = select(PFTResult).where(PFTResult.id == result_id).with_for_update()
#     result = db.execute(stmt).scalars().first()

#     if not result:
#         raise HTTPException(404, "Result not found")

#     # 1. Apply only the fields the admin actually sent
#     update_dict = {k: v for k, v in update_data.items() if v is not None}

#     # Protect evaluator info from being overwritten
#     update_dict.pop('evaluator_name', None)
#     update_dict.pop('evaluator_rank', None)
#     update_dict.pop('evaluator_id', None)
#     update_dict.pop('created_at', None)
#     update_dict.pop('updated_at', None)
#     update_dict.pop('id', None)

#     updated_fields = []
#     for key, value in update_dict.items():
#         if hasattr(result, key):
#             # Convert types if necessary
#             if key in ['year', 'age', 'cardio_cage', 'step_up_value', 'push_up_value', 'sit_up_value', 'chin_up_value']:
#                 try:
#                     value = int(value)
#                 except (ValueError, TypeError):
#                     pass
#             elif key in ['height', 'weight_current', 'sit_reach_value']:
#                 try:
#                     value = float(value)
#                 except (ValueError, TypeError):
#                     pass
#             setattr(result, key, value)
#             updated_fields.append(key)

#     # 2. Recompute all derived fields based on current (updated) record values
#     try:
#         if result.sex and result.age and result.height and result.weight_current:
#             recomputed = recompute_pft_from_record(result)
#             apply_computed_fields_to_record(result, recomputed)
#         else:
#             print(f"[SUPERADMIN UPDATE] Skipping recomputation - missing required fields")

#         # Explicit commit
#         db.commit()
#         db.refresh(result)

#         print(f"[SUPERADMIN UPDATE] Successfully updated record {result_id}")

#     except ValueError as ve:
#         db.rollback()
#         raise HTTPException(status_code=400, detail=str(ve))
#     except Exception as e:
#         db.rollback()
#         print(f"[SUPERADMIN UPDATE ERROR] {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to recompute and save updated PFT: {str(e)}"
#         )

#     # Return full record with all fields converted to serializable format
#     result_dict = {}
#     for c in result.__table__.columns:
#         val = getattr(result, c.name)
#         if hasattr(val, 'isoformat'):
#             result_dict[c.name] = val.isoformat()
#         else:
#             result_dict[c.name] = val

#     return result_dict

# # ---------- DELETE PFT RESULT ----------
# @router.delete("/pft-results/{result_id}")
# def delete_pft_result(
#     result_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
#     if not result:
#         raise HTTPException(404, "Result not found")

#     # Delete associated certificate first to avoid foreign key violation
#     from app.services.models import Certificate
#     certificate = db.query(Certificate).filter(
#         Certificate.pft_result_id == result_id
#     ).first()

#     if certificate:
#         db.delete(certificate)
#         db.flush()  # Flush to execute certificate deletion before PFT result

#     db.delete(result)
#     db.commit()
#     return {"message": f"PFT result {result_id} deleted successfully"}




from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.services.database import get_db
from app.services.models import User, PFTResult
from app.services.auth import require_super_admin, get_password_hash, set_session_cookie
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

# ---------- CONFIGURATION ----------
SUPERADMIN_SVC_NO = "NAF09/23345"
SUPERADMIN_PASSWORD = "Super-Admin2026"

# ---------- SCHEMAS ----------
class UserCreate(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str
    role: str
    assigned_admin_id: Optional[int] = None  # ← NEW: For direct assignment during creation

class UserOut(BaseModel):
    id: int
    svc_no: str
    full_name: str
    rank: str
    role: str
    assigned_admin_id: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class EvaluatorWithCount(BaseModel):
    id: int
    svc_no: str
    full_name: str
    rank: str
    assigned_admin_id: Optional[int] = None
    assigned_admin_name: Optional[str] = None
    evaluations_count: int

class AssignEvaluatorRequest(BaseModel):
    evaluator_id: int
    admin_id: int

# ---------- HELPER: Convert User to dict with string datetime ----------
def user_to_dict(user: User) -> dict:
    """Convert User model to dict with ISO format datetime string"""
    return {
        "id": user.id,
        "svc_no": user.svc_no,
        "full_name": user.full_name,
        "rank": user.rank,
        "role": user.role,
        "assigned_admin_id": user.assigned_admin_id,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

# ---------- STATIC SUPER ADMIN LOGIN ----------
@router.post("/login")
def superadmin_login(response: Response, credentials: dict, db: Session = Depends(get_db)):
    """
    Static login for super admin only.
    Credentials: NAF09/23345 / Super-Admin2026
    """
    svc_no = credentials.get("svc_no", "").strip().upper()
    password = credentials.get("password", "")

    svc_no = svc_no.replace("//", "/").strip()

    if svc_no != SUPERADMIN_SVC_NO.upper() or password != SUPERADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid super admin credentials"
        )

    super_admin = db.query(User).filter(User.svc_no == SUPERADMIN_SVC_NO.upper()).first()

    if not super_admin:
        super_admin = User(
            svc_no=SUPERADMIN_SVC_NO.upper(),
            full_name="Super Administrator",
            rank="System Administrator",
            hashed_password=get_password_hash(SUPERADMIN_PASSWORD),
            role="super_admin"
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        print(f"[SUPER ADMIN] Created new super admin: {SUPERADMIN_SVC_NO}")

    from app.services.auth import create_access_token
    access_token = create_access_token(data={"sub": super_admin.svc_no})

    # Set HTTP-only cookie
    set_session_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "super_admin",
        "full_name": super_admin.full_name,
        "rank": super_admin.rank
    }

# ---------- CREATE EVALUATOR (with optional admin assignment) ----------
@router.post("/evaluators", response_model=UserOut)
def create_evaluator(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if user_data.role != "evaluator":
        raise HTTPException(400, "Role must be 'evaluator' for this endpoint")

    svc_no = user_data.svc_no.upper().strip()

    existing = db.query(User).filter(User.svc_no == svc_no).first()
    if existing:
        raise HTTPException(
            409,
            f"Service number '{svc_no}' already registered as {existing.role}"
        )

    # ← NEW: Validate assigned_admin_id if provided
    if user_data.assigned_admin_id:
        admin = db.query(User).filter(
            User.id == user_data.assigned_admin_id,
            User.role == "admin"
        ).first()
        if not admin:
            raise HTTPException(404, "Selected admin not found")

    new_user = User(
        svc_no=svc_no,
        full_name=user_data.full_name.strip(),
        rank=user_data.rank.strip(),
        hashed_password=get_password_hash(user_data.password),
        role="evaluator",
        assigned_admin_id=user_data.assigned_admin_id  # ← NEW
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return user_to_dict(new_user)

# ---------- CREATE ADMIN ----------
@router.post("/admins", response_model=UserOut)
def create_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if user_data.role != "admin":
        raise HTTPException(400, "Role must be 'admin' for this endpoint")

    svc_no = user_data.svc_no.upper().strip()

    existing = db.query(User).filter(User.svc_no == svc_no).first()
    if existing:
        raise HTTPException(
            409,
            f"Service number '{svc_no}' already registered as {existing.role}"
        )

    new_user = User(
        svc_no=svc_no,
        full_name=user_data.full_name.strip(),
        rank=user_data.rank.strip(),
        hashed_password=get_password_hash(user_data.password),
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return user_to_dict(new_user)

# ---------- ASSIGN EVALUATOR TO ADMIN ----------
@router.post("/assign-evaluator")
def assign_evaluator_to_admin(
    data: AssignEvaluatorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Assign an evaluator to an admin."""
    evaluator = db.query(User).filter(
        User.id == data.evaluator_id,
        User.role == "evaluator"
    ).first()

    if not evaluator:
        raise HTTPException(404, "Evaluator not found")

    admin = db.query(User).filter(
        User.id == data.admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        raise HTTPException(404, "Admin not found")

    evaluator.assigned_admin_id = data.admin_id
    db.commit()
    db.refresh(evaluator)

    return {
        "message": f"Evaluator {evaluator.full_name} assigned to Admin {admin.full_name}",
        "evaluator": user_to_dict(evaluator),
        "admin": user_to_dict(admin)
    }

# ---------- REMOVE EVALUATOR FROM ADMIN ----------
@router.post("/unassign-evaluator/{evaluator_id}")
def unassign_evaluator(
    evaluator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Remove evaluator from admin assignment."""
    evaluator = db.query(User).filter(
        User.id == evaluator_id,
        User.role == "evaluator"
    ).first()

    if not evaluator:
        raise HTTPException(404, "Evaluator not found")

    evaluator.assigned_admin_id = None
    db.commit()
    db.refresh(evaluator)

    return {
        "message": f"Evaluator {evaluator.full_name} unassigned",
        "evaluator": user_to_dict(evaluator)
    }

# ---------- LIST EVALUATORS WITH EVALUATION COUNTS ----------
@router.get("/evaluators", response_model=List[EvaluatorWithCount])
def get_evaluators(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    results = db.query(
        User,
        func.count(PFTResult.id).label('eval_count')
    ).outerjoin(
        PFTResult,
        User.id == PFTResult.evaluator_id
    ).filter(
        User.role == "evaluator"
    ).group_by(User.id).all()

    return [
        {
            "id": user.id,
            "svc_no": user.svc_no,
            "full_name": user.full_name,
            "rank": user.rank,
            "assigned_admin_id": user.assigned_admin_id,
            "assigned_admin_name": user.admin.full_name if user.admin else None,
            "evaluations_count": eval_count
        }
        for user, eval_count in results
    ]

# ---------- LIST ADMINS WITH CERTIFICATE COUNTS ----------
@router.get("/admins", response_model=List[dict])
def get_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all admins with their certificate counts"""
    from app.services.models import Certificate

    admins = db.query(User).filter(User.role == "admin").all()

    result = []
    for admin in admins:
        cert_count = db.query(func.count(Certificate.id)).filter(
            Certificate.issued_by == admin.id
        ).scalar()

        # Count assigned evaluators
        assigned_count = db.query(func.count(User.id)).filter(
            User.assigned_admin_id == admin.id,
            User.role == "evaluator"
        ).scalar()

        admin_dict = user_to_dict(admin)
        admin_dict["certificates_count"] = cert_count
        admin_dict["assigned_evaluators_count"] = assigned_count
        result.append(admin_dict)

    return result

# ---------- GET SINGLE EVALUATOR DETAILS (FIXED) ----------
@router.get("/evaluators/{evaluator_id}")
def get_evaluator_details(
    evaluator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    evaluator = db.query(User).filter(
        User.id == evaluator_id,
        User.role == "evaluator"
    ).first()

    if not evaluator:
        raise HTTPException(404, "Evaluator not found")

    evaluations = db.query(PFTResult).filter(
        PFTResult.evaluator_id == evaluator_id
    ).order_by(PFTResult.created_at.desc()).all()

    # FIXED: Manually query the assigned admin instead of relying on lazy relationship
    assigned_admin = None
    if evaluator.assigned_admin_id:
        admin = db.query(User).filter(
            User.id == evaluator.assigned_admin_id,
            User.role == "admin"
        ).first()
        if admin:
            assigned_admin = {
                "id": admin.id,
                "svc_no": admin.svc_no,
                "full_name": admin.full_name,
                "rank": admin.rank,
                "role": admin.role,
            }

    return {
        "evaluator": user_to_dict(evaluator),
        "assigned_admin": assigned_admin,
        "evaluations_count": len(evaluations),
        "evaluations": [
            {
                "id": eval.id,
                "svc_no": eval.svc_no,
                "full_name": eval.full_name,
                "rank": eval.rank,           # ← ADDED
                "unit": eval.unit,           # ← ADDED
                "year": eval.year,
                "grade": eval.grade,
                "created_at": eval.created_at.isoformat() if eval.created_at else None
            }
            for eval in evaluations
        ]
    }

# ---------- GET SINGLE ADMIN DETAILS WITH CERTIFICATES ----------
@router.get("/admins/{admin_id}")
def get_admin_details(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get admin details with certificates issued"""
    from app.services.models import Certificate

    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        raise HTTPException(404, "Admin not found")

    # Get certificates issued by this admin
    certificates = db.query(Certificate).filter(
        Certificate.issued_by == admin_id
    ).order_by(Certificate.created_at.desc()).all()

    # Get assigned evaluators
    assigned_evaluators = db.query(User).filter(
        User.assigned_admin_id == admin_id,
        User.role == "evaluator"
    ).all()

    return {
        "admin": user_to_dict(admin),
        "certificates_count": len(certificates),
        "certificates": [
            {
                "id": cert.id,
                "certificate_number": cert.certificate_number,
                "personnel_name": cert.personnel_name,
                "personnel_svc_no": cert.personnel_svc_no,
                "personnel_rank": cert.personnel_rank,
                "personnel_unit": cert.personnel_unit,
                "status": cert.status,
                "created_at": cert.created_at.isoformat() if cert.created_at else None
            }
            for cert in certificates
        ],
        "assigned_evaluators": [
            {
                "id": ev.id,
                "svc_no": ev.svc_no,
                "full_name": ev.full_name,
                "rank": ev.rank
            }
            for ev in assigned_evaluators
        ]
    }

# ---------- DELETE EVALUATOR ----------
@router.delete("/evaluators/{evaluator_id}")
def delete_evaluator(
    evaluator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    evaluator = db.query(User).filter(
        User.id == evaluator_id,
        User.role == "evaluator"
    ).first()

    if not evaluator:
        raise HTTPException(404, "Evaluator not found")

    db.delete(evaluator)
    db.commit()
    return {"message": f"Evaluator {evaluator.svc_no} deleted successfully"}

# ---------- DELETE ADMIN ----------
@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == "admin"
    ).first()

    if not admin:
        raise HTTPException(404, "Admin not found")

    # Unassign all evaluators from this admin first
    db.query(User).filter(
        User.assigned_admin_id == admin_id
    ).update({"assigned_admin_id": None})

    db.delete(admin)
    db.commit()
    return {"message": f"Admin {admin.svc_no} deleted successfully"}

# ---------- GET ALL PFT RESULTS ----------
@router.get("/pft-results")
def get_all_pft_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    results = db.query(PFTResult).order_by(PFTResult.created_at.desc()).all()
    return results

# ---------- GET SINGLE PFT RESULT ----------
@router.get("/pft-results/{result_id}")
def get_pft_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
    if not result:
        raise HTTPException(404, "Result not found")
    return result

# ---------- UPDATE PFT RESULT ----------
@router.put("/pft-results/{result_id}")
def update_pft_result(
    result_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    from app.services.pft_utils import recompute_pft_from_record, apply_computed_fields_to_record

    # Get record with lock
    stmt = select(PFTResult).where(PFTResult.id == result_id).with_for_update()
    result = db.execute(stmt).scalars().first()

    if not result:
        raise HTTPException(404, "Result not found")

    # 1. Apply only the fields the admin actually sent
    update_dict = {k: v for k, v in update_data.items() if v is not None}

    # Protect evaluator info from being overwritten
    update_dict.pop('evaluator_name', None)
    update_dict.pop('evaluator_rank', None)
    update_dict.pop('evaluator_id', None)
    update_dict.pop('created_at', None)
    update_dict.pop('updated_at', None)
    update_dict.pop('id', None)

    updated_fields = []
    for key, value in update_dict.items():
        if hasattr(result, key):
            # Convert types if necessary
            if key in ['year', 'age', 'cardio_cage', 'step_up_value', 'push_up_value', 'sit_up_value', 'chin_up_value']:
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    pass
            elif key in ['height', 'weight_current', 'sit_reach_value']:
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    pass
            setattr(result, key, value)
            updated_fields.append(key)

    # 2. Recompute all derived fields based on current (updated) record values
    try:
        if result.sex and result.age and result.height and result.weight_current:
            recomputed = recompute_pft_from_record(result)
            apply_computed_fields_to_record(result, recomputed)
        else:
            print(f"[SUPERADMIN UPDATE] Skipping recomputation - missing required fields")

        # Explicit commit
        db.commit()
        db.refresh(result)

        print(f"[SUPERADMIN UPDATE] Successfully updated record {result_id}")

    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        print(f"[SUPERADMIN UPDATE ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to recompute and save updated PFT: {str(e)}"
        )

    # Return full record with all fields converted to serializable format
    result_dict = {}
    for c in result.__table__.columns:
        val = getattr(result, c.name)
        if hasattr(val, 'isoformat'):
            result_dict[c.name] = val.isoformat()
        else:
            result_dict[c.name] = val

    return result_dict

# ---------- DELETE PFT RESULT ----------
@router.delete("/pft-results/{result_id}")
def delete_pft_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
    if not result:
        raise HTTPException(404, "Result not found")

    # Delete associated certificate first to avoid foreign key violation
    from app.services.models import Certificate
    certificate = db.query(Certificate).filter(
        Certificate.pft_result_id == result_id
    ).first()

    if certificate:
        db.delete(certificate)
        db.flush()  # Flush to execute certificate deletion before PFT result

    db.delete(result)
    db.commit()
    return {"message": f"PFT result {result_id} deleted successfully"}