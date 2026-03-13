# # backend/app/services/models.py
# from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, JSON
# from sqlalchemy.sql import func
# from .database import Base

# class PFTResult(Base):
#     __tablename__ = "pft_results"

#     id = Column(Integer, primary_key=True, index=True)
#     year = Column(Integer, nullable=False)
#     svc_no = Column(String(50), nullable=False)

#     full_name = Column(String(100))
#     rank = Column(String(50))
#     unit = Column(String(100))
#     appointment = Column(String(100))

#     # ── ADDED HERE ──
#     email = Column(String(120), nullable=True)          # Email address
#     date = Column(String(20), nullable=True)            # Date string (or use Date type below)

#     age = Column(Integer)
#     sex = Column(String(10))
#     height = Column(Float)
#     weight_current = Column(Float)
#     bmi_current = Column(Float)
#     bmi_status = Column(String(20))
#     cardio_cage = Column(Integer)
#     step_up_value = Column(Integer)
#     push_up_value = Column(Integer)
#     sit_up_value = Column(Integer)
#     chin_up_value = Column(Integer)
#     sit_reach_value = Column(Float)

#     # Computed fields (already good)
#     weight_ideal = Column(Float)
#     weight_excess = Column(Float)
#     weight_deficit = Column(Float)
#     weight_status = Column(String(50))

#     bmi_ideal = Column(JSON)
#     bmi_excess = Column(Float)
#     bmi_deficit = Column(Float)
#     bmi_points = Column(Integer)

#     cardio_type = Column(String(20))
#     cardio_value = Column(Integer)
#     cardio_ideal = Column(JSON)
#     cardio_status = Column(String(20))
#     cardio_points = Column(Integer)

#     step_up_ideal = Column(JSON)
#     step_up_status = Column(String(20))
#     step_up_points = Column(Integer)

#     push_up_ideal = Column(JSON)
#     push_up_status = Column(String(20))
#     push_up_points = Column(Integer)

#     sit_up_ideal = Column(JSON)
#     sit_up_status = Column(String(20))
#     sit_up_points = Column(Integer)

#     chin_up_ideal = Column(JSON)
#     chin_up_status = Column(String(20))
#     chin_up_points = Column(Integer)

#     sit_reach_ideal = Column(JSON)
#     sit_reach_status = Column(String(20))
#     sit_reach_points = Column(Integer)

#     aggregate = Column(Float)
#     grade = Column(String(20))
#     prescription_duration = Column(String(50))
#     prescription_days = Column(String(50))
#     recommended_activity = Column(String(255))

#     evaluator_name = Column(String(100))
#     evaluator_rank = Column(String(50))
#     notes = Column(String(500), nullable=True)

#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())

#     __table_args__ = (
#         UniqueConstraint('svc_no', 'year', name='uq_svc_no_year'),
#     )


from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, JSON
from sqlalchemy.sql import func
from .database import Base


# PFT RESULT MODEL
class PFTResult(Base):

    __tablename__ = "pft_results"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Identity
    year = Column(Integer, nullable=False, index=True)
    svc_no = Column(String(50), nullable=False, index=True)

    full_name = Column(String(100))
    rank = Column(String(50))
    unit = Column(String(100))
    appointment = Column(String(100))

    email = Column(String(120), nullable=True)
    date = Column(String(20), nullable=True)

    # Personal Data
    age = Column(Integer)
    sex = Column(String(10))

    height = Column(Float)
    weight_current = Column(Float)

    # BMI
    bmi_current = Column(Float)
    bmi_status = Column(String(20))

    bmi_ideal = Column(JSON)
    bmi_excess = Column(Float)
    bmi_deficit = Column(Float)
    bmi_points = Column(Integer)

    # Weight Evaluation
    weight_ideal = Column(Float)
    weight_excess = Column(Float)
    weight_deficit = Column(Float)
    weight_status = Column(String(50))

    # Cardio
    cardio_cage = Column(Integer)

    cardio_type = Column(String(20))
    cardio_value = Column(Integer)

    cardio_ideal = Column(JSON)
    cardio_status = Column(String(20))
    cardio_points = Column(Integer)

    # Strength Tests
    step_up_value = Column(Integer)
    step_up_ideal = Column(JSON)
    step_up_status = Column(String(20))
    step_up_points = Column(Integer)

    push_up_value = Column(Integer)
    push_up_ideal = Column(JSON)
    push_up_status = Column(String(20))
    push_up_points = Column(Integer)

    sit_up_value = Column(Integer)
    sit_up_ideal = Column(JSON)
    sit_up_status = Column(String(20))
    sit_up_points = Column(Integer)

    chin_up_value = Column(Integer)
    chin_up_ideal = Column(JSON)
    chin_up_status = Column(String(20))
    chin_up_points = Column(Integer)

    sit_reach_value = Column(Float)
    sit_reach_ideal = Column(JSON)
    sit_reach_status = Column(String(20))
    sit_reach_points = Column(Integer)

    # Final Results
    aggregate = Column(Float)
    grade = Column(String(20))

    # Prescription / Recommendation
    prescription_duration = Column(String(50))
    prescription_days = Column(String(50))
    recommended_activity = Column(String(255))

    # Evaluator Info
    evaluator_name = Column(String(100))
    evaluator_rank = Column(String(50))

    notes = Column(String(500), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Prevent duplicate entries
    __table_args__ = (
        UniqueConstraint("svc_no", "year", name="uq_svc_no_year"),
    )


# USER MODEL (AUTH SYSTEM)
class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    svc_no = Column(String(50), unique=True, nullable=False, index=True)

    full_name = Column(String(100), nullable=False)
    rank = Column(String(50), nullable=False)

    email = Column(String(120), unique=True, index=True, nullable=True)

    hashed_password = Column(String(255), nullable=False)

    role = Column(
        String(30),
        default="evaluator"
    )  # evaluator / admin / super_admin

    created_at = Column(DateTime(timezone=True), server_default=func.now())