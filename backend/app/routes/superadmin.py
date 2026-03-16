from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.database import get_db
from app.services.models import User, PFTResult
from app.services.auth import get_password_hash, create_access_token, require_super_admin, verify_password
from app.schemas import UserRegister, Token

router = APIRouter(prefix="/superadmin", tags=["superadmin"])

class SuperAdminLogin(BaseModel):
    svc_no: str
    password: str

@router.post("/login", response_model=Token)
def superadmin_login(data: SuperAdminLogin, db: Session = Depends(get_db)):
    svc_no = data.svc_no.strip().upper()
    user = db.query(User).filter(User.svc_no == svc_no, User.role == "super_admin").first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid super admin credentials")
    access_token = create_access_token(data={"sub": user.svc_no})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "super_admin",
        "full_name": user.full_name,
        "rank": user.rank
    }

@router.post("/create-evaluator")
def create_evaluator(
    data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    svc_no = data.svc_no.strip().upper()
    if db.query(User).filter(User.svc_no == svc_no).first():
        raise HTTPException(409, "Service number already exists")
    new_user = User(
        svc_no=svc_no,
        full_name=data.full_name.strip(),
        rank=data.rank.strip(),
        hashed_password=get_password_hash(data.password),
        role="evaluator"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Evaluator created", "svc_no": new_user.svc_no}

@router.post("/create-admin")
def create_admin(
    data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    svc_no = data.svc_no.strip().upper()
    if db.query(User).filter(User.svc_no == svc_no).first():
        raise HTTPException(409, "Service number already exists")
    new_user = User(
        svc_no=svc_no,
        full_name=data.full_name.strip(),
        rank=data.rank.strip(),
        hashed_password=get_password_hash(data.password),
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Admin created", "svc_no": new_user.svc_no}

@router.get("/evaluators")
def get_evaluators(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    evaluators = db.query(User).filter(User.role == "evaluator").all()
    result = []
    for ev in evaluators:
        count = db.query(PFTResult).filter(PFTResult.evaluator_name == ev.full_name).count()
        result.append({
            "id": ev.id,
            "svc_no": ev.svc_no,
            "full_name": ev.full_name,
            "rank": ev.rank,
            "evaluations_count": count
        })
    return result

@router.get("/admins")
def get_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    admins = db.query(User).filter(User.role == "admin").all()
    return [
        {"id": a.id, "svc_no": a.svc_no, "full_name": a.full_name, "rank": a.rank}
        for a in admins
    ]

@router.delete("/users/{svc_no}")
def delete_user(
    svc_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    if svc_no.upper() == current_user.svc_no:
        raise HTTPException(403, "Cannot delete yourself")
    user = db.query(User).filter(User.svc_no == svc_no.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == "super_admin":
        raise HTTPException(403, "Cannot delete super admin")
    db.delete(user)
    db.commit()
    return {"message": f"User {svc_no} deleted"}

# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from app.services.database import get_db
# from app.services.models import User
# from app.services.auth import require_super_admin

# router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# @router.get("/evaluators")
# def get_evaluators(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):

#     evaluators = db.query(User).filter(User.role == "evaluator").all()

#     return evaluators


# @router.get("/admins")
# def get_admins(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(require_super_admin)
# ):

#     admins = db.query(User).filter(User.role == "admin").all()

#     return admins