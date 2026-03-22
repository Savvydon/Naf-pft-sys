from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.database import get_db
from app.services.models import User, PFTResult
from app.services.auth import require_super_admin, get_password_hash, set_session_cookie
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

# ---------- CONFIGURATION ----------
SUPERADMIN_SVC_NO = "NAF09/23345"
SUPERADMIN_PASSWORD = "Super-Admin2026!"

# ---------- SCHEMAS ----------
class UserCreate(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str
    role: str

class UserOut(BaseModel):
    id: int
    svc_no: str
    full_name: str
    rank: str
    role: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class EvaluatorWithCount(BaseModel):
    id: int
    svc_no: str
    full_name: str
    rank: str
    evaluations_count: int

# ---------- HELPER: Convert User to dict with string datetime ----------
def user_to_dict(user: User) -> dict:
    """Convert User model to dict with ISO format datetime string"""
    return {
        "id": user.id,
        "svc_no": user.svc_no,
        "full_name": user.full_name,
        "rank": user.rank,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

# ---------- STATIC SUPER ADMIN LOGIN ----------
@router.post("/login")
def superadmin_login(response: Response, credentials: dict, db: Session = Depends(get_db)):
    """
    Static login for super admin only.
    Credentials: NAF09/22119 / Super-Admin-2026
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

# ---------- CREATE EVALUATOR ----------
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
 
    new_user = User(
        svc_no=svc_no,
        full_name=user_data.full_name.strip(),
        rank=user_data.rank.strip(),
        hashed_password=get_password_hash(user_data.password),
        role="evaluator"
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
        (User.full_name == PFTResult.evaluator_name) &
        (User.rank == PFTResult.evaluator_rank)
    ).filter(
        User.role == "evaluator"
    ).group_by(User.id).all()
 
    return [
        {
            "id": user.id,
            "svc_no": user.svc_no,
            "full_name": user.full_name,
            "rank": user.rank,
            "evaluations_count": eval_count
        }
        for user, eval_count in results
    ]

# ---------- LIST ADMINS ----------
@router.get("/admins", response_model=List[UserOut])
def get_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    admins = db.query(User).filter(User.role == "admin").all()
    return [user_to_dict(admin) for admin in admins]

# ---------- GET SINGLE EVALUATOR DETAILS ----------
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
        PFTResult.evaluator_name == evaluator.full_name,
        PFTResult.evaluator_rank == evaluator.rank
    ).order_by(PFTResult.created_at.desc()).all()
 
    return {
        "evaluator": user_to_dict(evaluator),
        "evaluations_count": len(evaluations),
        "evaluations": [
            {
                "id": eval.id,
                "svc_no": eval.svc_no,
                "full_name": eval.full_name,
                "year": eval.year,
                "grade": eval.grade,
                "created_at": eval.created_at.isoformat() if eval.created_at else None
            }
            for eval in evaluations
        ]
    }

# ---------- GET SINGLE ADMIN DETAILS ----------
@router.get("/admins/{admin_id}")
def get_admin_details(
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
 
    return user_to_dict(admin)

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
    
    result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
    if not result:
        raise HTTPException(404, "Result not found")
 
    # 1. Apply only the fields the admin actually sent
    update_dict = {k: v for k, v in update_data.items() if v is not None}
    
    # Protect evaluator info from being overwritten
    update_dict.pop('evaluator_name', None)
    update_dict.pop('evaluator_rank', None)
    update_dict.pop('created_at', None)
    update_dict.pop('updated_at', None)
 
    updated_fields = []
    for key, value in update_dict.items():
        if hasattr(result, key):
            setattr(result, key, value)
            updated_fields.append(key)

    # 2. Recompute all derived fields based on current (updated) record values
    try:
        recomputed = recompute_pft_from_record(result)
        apply_computed_fields_to_record(result, recomputed)

        db.commit()
        db.refresh(result)

    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to recompute and save updated PFT: {str(e)}"
        )
 
    return result

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
 
    db.delete(result)
    db.commit()
    return {"message": f"PFT result {result_id} deleted successfully"}


# from datetime import datetime, timezone
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from app.services.database import get_db
# from app.services.models import User, PFTResult
# from app.services.auth import require_super_admin, get_password_hash
# from app.services.pft_utils import recompute_pft_from_record, apply_computed_fields_to_record
# from pydantic import BaseModel
# from typing import List, Optional

# router = APIRouter(prefix="/superadmin", tags=["superadmin"])from datetime import datetime

# # ---------- CONFIGURATION ----------
# SUPERADMIN_SVC_NO = "NAF09/23345"
# SUPERADMIN_PASSWORD = "Super-Admin2026!"

# # ---------- SCHEMAS ----------
# class UserCreate(BaseModel):
#     svc_no: str
#     full_name: str
#     rank: str
#     password: str
#     role: str

# class UserOut(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     role: str
#     created_at: Optional[str] = None

#     class Config:
#         from_attributes = True

# class EvaluatorWithCount(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     evaluations_count: int

# # ---------- HELPER: Convert User to dict with string datetime ----------
# def user_to_dict(user: User) -> dict:
#     """Convert User model to dict with ISO format datetime string"""
#     return {
#         "id": user.id,
#         "svc_no": user.svc_no,
#         "full_name": user.full_name,
#         "rank": user.rank,
#         "role": user.role,
#         "created_at": user.created_at.isoformat() if user.created_at else None
#     }

# # ---------- STATIC SUPER ADMIN LOGIN ----------
# @router.post("/login")
# def superadmin_login(credentials: dict, db: Session = Depends(get_db)):
#     """
#     Static login for super admin only.
#     Credentials: NAF09/22119 / Super-Admin-2026
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
 
#     from app.services.auth import create_access_token, create_session
#     access_token = create_access_token(data={"sub": super_admin.svc_no})
    
#     # Create session for super admin too
#     create_session(db, super_admin, access_token)
 
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "role": "super_admin",
#         "full_name": super_admin.full_name,
#         "rank": super_admin.rank
#     }

# # ---------- CREATE EVALUATOR ----------
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
 
#     new_user = User(
#         svc_no=svc_no,
#         full_name=user_data.full_name.strip(),
#         rank=user_data.rank.strip(),
#         hashed_password=get_password_hash(user_data.password),
#         role="evaluator"
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
#         (User.full_name == PFTResult.evaluator_name) &
#         (User.rank == PFTResult.evaluator_rank)
#     ).filter(
#         User.role == "evaluator"
#     ).group_by(User.id).all()
 
#     return [
#         {
#             "id": user.id,
#             "svc_no": user.svc_no,
#             "full_name": user.full_name,
#             "rank": user.rank,
#             "evaluations_count": eval_count
#         }
#         for user, eval_count in results
#     ]

# # ---------- LIST ADMINS ----------
# @router.get("/admins", response_model=List[UserOut])
# def get_admins(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     admins = db.query(User).filter(User.role == "admin").all()
#     return [user_to_dict(admin) for admin in admins]

# # ---------- GET SINGLE EVALUATOR DETAILS ----------
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
#         PFTResult.evaluator_name == evaluator.full_name,
#         PFTResult.evaluator_rank == evaluator.rank
#     ).order_by(PFTResult.created_at.desc()).all()
 
#     return {
#         "evaluator": user_to_dict(evaluator),
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

# # ---------- GET SINGLE ADMIN DETAILS ----------
# @router.get("/admins/{admin_id}")
# def get_admin_details(
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
 
#     return user_to_dict(admin)

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

# # ---------- UPDATE PFT RESULT WITH RECOMPUTATION ----------
# @router.put("/pft-results/{result_id}")
# def update_pft_result(
#     result_id: int,
#     update_data: dict,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
#     if not result:
#         raise HTTPException(404, "Result not found")
    
#     # Protect evaluator info from being overwritten
#     update_data.pop('evaluator_name', None)
#     update_data.pop('evaluator_rank', None)
 
#     # Apply updates to input fields
#     for key, value in update_data.items():
#         if hasattr(result, key):
#             setattr(result, key, value)
    
#     # Recompute all derived fields
#     try:
#         recomputed = recompute_pft_from_record(result)
#         apply_computed_fields_to_record(result, recomputed)
        
#         db.commit()
#         db.refresh(result)
        
#         # Return full updated record
#         result_dict = {
#             c.name: getattr(result, c.name)
#             for c in result.__table__.columns
#         }
#         if result_dict.get('created_at'):
#             result_dict['created_at'] = result_dict['created_at'].isoformat()
#         if result_dict.get('updated_at'):
#             result_dict['updated_at'] = result_dict['updated_at'].isoformat()
            
#         return {
#             "message": "PFT result updated and all scores recomputed successfully",
#             "record": result_dict,
#             "new_aggregate": result.aggregate,
#             "new_grade": result.grade,
#         }
        
#     except ValueError as ve:
#         db.rollback()
#         raise HTTPException(status_code=400, detail=str(ve))
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to recompute and save updated PFT: {str(e)}"
#         )

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
 
#     db.delete(result)
#     db.commit()
#     return {"message": f"PFT result {result_id} deleted successfully"}

#=== old code===
# from datetime import datetime
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from app.services.database import get_db
# from app.services.models import User, PFTResult
# from app.services.auth import require_super_admin, get_password_hash
# from pydantic import BaseModel
# from typing import List, Optional

# router = APIRouter(prefix="/superadmin", tags=["superadmin"])

# # ---------- CONFIGURATION ----------
# SUPERADMIN_SVC_NO = "NAF09/23345"
# SUPERADMIN_PASSWORD = "Super-Admin2026!"

# # ---------- SCHEMAS ----------
# class UserCreate(BaseModel):
#     svc_no: str
#     full_name: str
#     rank: str
#     password: str
#     role: str

# class UserOut(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     role: str
#     created_at: Optional[str] = None

#     class Config:
#         from_attributes = True

# class EvaluatorWithCount(BaseModel):
#     id: int
#     svc_no: str
#     full_name: str
#     rank: str
#     evaluations_count: int

# # ---------- HELPER: Convert User to dict with string datetime ----------
# def user_to_dict(user: User) -> dict:
#     """Convert User model to dict with ISO format datetime string"""
#     return {
#         "id": user.id,
#         "svc_no": user.svc_no,
#         "full_name": user.full_name,
#         "rank": user.rank,
#         "role": user.role,
#         "created_at": user.created_at.isoformat() if user.created_at else None
#     }

# # ---------- STATIC SUPER ADMIN LOGIN ----------
# @router.post("/login")
# def superadmin_login(credentials: dict, db: Session = Depends(get_db)):
#     """
#     Static login for super admin only.
#     Credentials: NAF09/22119 / Super-Admin-2026
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
    
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "role": "super_admin",
#         "full_name": super_admin.full_name,
#         "rank": super_admin.rank
#     }

# # ---------- CREATE EVALUATOR ----------
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
    
#     new_user = User(
#         svc_no=svc_no,
#         full_name=user_data.full_name.strip(),
#         rank=user_data.rank.strip(),
#         hashed_password=get_password_hash(user_data.password),
#         role="evaluator"
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
#         (User.full_name == PFTResult.evaluator_name) & 
#         (User.rank == PFTResult.evaluator_rank)
#     ).filter(
#         User.role == "evaluator"
#     ).group_by(User.id).all()
    
#     return [
#         {
#             "id": user.id,
#             "svc_no": user.svc_no,
#             "full_name": user.full_name,
#             "rank": user.rank,
#             "evaluations_count": eval_count
#         }
#         for user, eval_count in results
#     ]

# # ---------- LIST ADMINS ----------
# @router.get("/admins", response_model=List[UserOut])
# def get_admins(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):
#     admins = db.query(User).filter(User.role == "admin").all()
#     return [user_to_dict(admin) for admin in admins]

# # ---------- GET SINGLE EVALUATOR DETAILS ----------
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
#         PFTResult.evaluator_name == evaluator.full_name,
#         PFTResult.evaluator_rank == evaluator.rank
#     ).order_by(PFTResult.created_at.desc()).all()
    
#     return {
#         "evaluator": user_to_dict(evaluator),
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

# # ---------- GET SINGLE ADMIN DETAILS ----------
# @router.get("/admins/{admin_id}")
# def get_admin_details(
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
    
#     return user_to_dict(admin)

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
#     result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
#     if not result:
#         raise HTTPException(404, "Result not found")
    
#     for key, value in update_data.items():
#         if hasattr(result, key):
#             setattr(result, key, value)
    
#     db.commit()
#     db.refresh(result)
#     return result

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
    
#     db.delete(result)
#     db.commit()
#     return {"message": f"PFT result {result_id} deleted successfully"}
