from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.database import get_db
from app.services.models import User, PFTResult
from app.services.auth import require_super_admin, get_password_hash
from app.services.naf_pft import compute_naf_pft
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
def superadmin_login(credentials: dict, db: Session = Depends(get_db)):
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
    """SuperAdmin only: Update PFT result and recompute derived values"""
    result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
    if not result:
        raise HTTPException(404, "Result not found")
    
    # Prevent changing evaluator info via update
    update_data.pop('evaluator_name', None)
    update_data.pop('evaluator_rank', None)
    
    # Apply updates
    for key, value in update_data.items():
        if hasattr(result, key):
            setattr(result, key, value)
    
    # Check if any computation-relevant fields were changed
    computation_fields = {
        'age', 'sex', 'height', 'weight_current', 'cardio_cage', 
        'step_up_value', 'push_up_value', 'sit_up_value', 'chin_up_value', 'sit_reach_value',
        'step_up', 'push_up', 'sit_up', 'chin_up', 'sit_reach', 'weight'
    }
    
    if computation_fields.intersection(update_data.keys()):
        # Build input data for computation from updated record
        compute_input = {
            'year': result.year,
            'full_name': result.full_name,
            'rank': result.rank,
            'svc_no': result.svc_no,
            'unit': result.unit,
            'appointment': result.appointment,
            'email': result.email,
            'date': result.date,
            'age': result.age,
            'sex': result.sex,
            'height': result.height,
            'weight': result.weight_current,
            'cardio_cage': result.cardio_cage,
            'step_up': result.step_up_value,
            'push_up': result.push_up_value,
            'sit_up': result.sit_up_value,
            'chin_up': result.chin_up_value,
            'sit_reach': result.sit_reach_value,
            'evaluator_name': result.evaluator_name,
            'evaluator_rank': result.evaluator_rank,
        }
        
        # Re-run the computation
        new_result = compute_naf_pft(compute_input)
        
        if "error" in new_result:
            raise HTTPException(400, f"Computation error: {new_result['error']}")
        
        # Update all computed fields in the record
        computed_mappings = {
            'weight_ideal': new_result['weight_ideal'],
            'weight_excess': new_result['weight_excess'],
            'weight_deficit': new_result['weight_deficit'],
            'weight_status': new_result['weight_status'],
            'bmi_current': new_result['bmi_current'],
            'bmi_ideal': new_result['bmi_ideal'],
            'bmi_excess': new_result['bmi_excess'],
            'bmi_deficit': new_result['bmi_deficit'],
            'bmi_status': new_result['bmi_status'],
            'bmi_points': new_result['bmi_points'],
            'cardio_type': new_result['cardio_type'],
            'cardio_value': new_result['cardio_value'],
            'cardio_ideal': new_result['cardio_ideal'],
            'cardio_status': new_result['cardio_status'],
            'cardio_points': new_result['cardio_points'],
            'step_up_value': new_result['step_up_value'],
            'step_up_ideal': new_result['step_up_ideal'],
            'step_up_status': new_result['step_up_status'],
            'step_up_points': new_result['step_up_points'],
            'push_up_value': new_result['push_up_value'],
            'push_up_ideal': new_result['push_up_ideal'],
            'push_up_status': new_result['push_up_status'],
            'push_up_points': new_result['push_up_points'],
            'sit_up_value': new_result['sit_up_value'],
            'sit_up_ideal': new_result['sit_up_ideal'],
            'sit_up_status': new_result['sit_up_status'],
            'sit_up_points': new_result['sit_up_points'],
            'chin_up_value': new_result['chin_up_value'],
            'chin_up_ideal': new_result['chin_up_ideal'],
            'chin_up_status': new_result['chin_up_status'],
            'chin_up_points': new_result['chin_up_points'],
            'sit_reach_value': new_result['sit_reach_value'],
            'sit_reach_ideal': new_result['sit_reach_ideal'],
            'sit_reach_status': new_result['sit_reach_status'],
            'sit_reach_points': new_result['sit_reach_points'],
            'aggregate': new_result['aggregate'],
            'grade': new_result['grade'],
            'prescription_duration': new_result['prescription_duration'],
            'prescription_days': new_result['prescription_days'],
            'recommended_activity': new_result['recommended_activity'],
        }
        
        for key, value in computed_mappings.items():
            if hasattr(result, key):
                setattr(result, key, value)
    
    db.commit()
    db.refresh(result)
    
    # Convert to dict for response
    result_dict = {
        c.name: getattr(result, c.name)
        for c in result.__table__.columns
    }
    if result_dict.get('created_at'):
        result_dict['created_at'] = result_dict['created_at'].isoformat()
    if result_dict.get('updated_at'):
        result_dict['updated_at'] = result_dict['updated_at'].isoformat()
    
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
    
    db.delete(result)
    db.commit()
    return {"message": f"PFT result {result_id} deleted successfully"}

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
