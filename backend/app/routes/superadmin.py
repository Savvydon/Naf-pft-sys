from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.database import get_db
from app.services.models import User, PFTResult
from app.services.auth import require_super_admin, get_password_hash
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

# ---------- SCHEMAS ----------
class UserCreate(BaseModel):
    svc_no: str
    full_name: str
    rank: str
    password: str
    role: str  # "evaluator" or "admin"

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

# ---------- STATIC SUPER ADMIN LOGIN ----------
@router.post("/login")
def superadmin_login(credentials: dict, db: Session = Depends(get_db)):
    """
    Static login for super admin only.
    Expected: {"svc_no": "NAF/ADMIN/SUPER", "password": "SuperAdmin2024!"}
    """
    STATIC_SVC_NO = "NAF09/23345"
    STATIC_PASSWORD = "Super-Admin2026!"
    
    svc_no = credentials.get("svc_no", "").strip().upper()
    password = credentials.get("password", "")
    
    if svc_no != STATIC_SVC_NO or password != STATIC_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid super admin credentials"
        )
    
    # Check if super admin exists in DB, if not create it
    super_admin = db.query(User).filter(User.svc_no == STATIC_SVC_NO).first()
    
    if not super_admin:
        super_admin = User(
            svc_no=STATIC_SVC_NO,
            full_name="Super Administrator",
            rank="System Admin",
            hashed_password=get_password_hash(STATIC_PASSWORD),
            role="super_admin"
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
    
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
    
    # Check if service number exists
    existing = db.query(User).filter(User.svc_no == user_data.svc_no.upper()).first()
    if existing:
        raise HTTPException(409, "Service number already registered")
    
    new_user = User(
        svc_no=user_data.svc_no.upper(),
        full_name=user_data.full_name.strip(),
        rank=user_data.rank.strip(),
        hashed_password=get_password_hash(user_data.password),
        role="evaluator"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# ---------- CREATE ADMIN ----------
@router.post("/admins", response_model=UserOut)
def create_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if user_data.role != "admin":
        raise HTTPException(400, "Role must be 'admin' for this endpoint")
    
    existing = db.query(User).filter(User.svc_no == user_data.svc_no.upper()).first()
    if existing:
        raise HTTPException(409, "Service number already registered")
    
    new_user = User(
        svc_no=user_data.svc_no.upper(),
        full_name=user_data.full_name.strip(),
        rank=user_data.rank.strip(),
        hashed_password=get_password_hash(user_data.password),
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# ---------- LIST EVALUATORS WITH EVALUATION COUNTS ----------
@router.get("/evaluators", response_model=List[EvaluatorWithCount])
def get_evaluators(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    # Get all evaluators with their evaluation counts
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
    return admins

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
    
    # Get evaluations done by this evaluator
    evaluations = db.query(PFTResult).filter(
        PFTResult.evaluator_name == evaluator.full_name,
        PFTResult.evaluator_rank == evaluator.rank
    ).order_by(PFTResult.created_at.desc()).all()
    
    return {
        "evaluator": {
            "id": evaluator.id,
            "svc_no": evaluator.svc_no,
            "full_name": evaluator.full_name,
            "rank": evaluator.rank,
            "created_at": evaluator.created_at.isoformat() if evaluator.created_at else None
        },
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
    
    return {
        "id": admin.id,
        "svc_no": admin.svc_no,
        "full_name": admin.full_name,
        "rank": admin.rank,
        "created_at": admin.created_at.isoformat() if admin.created_at else None
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
    
    db.delete(admin)
    db.commit()
    return {"message": f"Admin {admin.svc_no} deleted successfully"}

# ---------- GET ALL PFT RESULTS (for super admin) ----------
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
    result = db.query(PFTResult).filter(PFTResult.id == result_id).first()
    if not result:
        raise HTTPException(404, "Result not found")
    
    for key, value in update_data.items():
        if hasattr(result, key):
            setattr(result, key, value)
    
    db.commit()
    db.refresh(result)
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