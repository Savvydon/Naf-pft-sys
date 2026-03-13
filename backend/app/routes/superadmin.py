from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.services.models import User
from app.services.auth import require_super_admin

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


@router.get("/evaluators")
def get_evaluators(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):

    evaluators = db.query(User).filter(User.role == "evaluator").all()

    return evaluators


@router.get("/admins")
def get_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):

    admins = db.query(User).filter(User.role == "admin").all()

    return admins