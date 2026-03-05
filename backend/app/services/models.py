from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from .database import Base

class PFTResult(Base):
    __tablename__ = "pft_results"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    svc_no = Column(String(50), nullable=False)

    full_name = Column(String(100))
    rank = Column(String(50))
    unit = Column(String(100))
    appointment = Column(String(100))
    age = Column(Integer)
    sex = Column(String(10))
    height = Column(Float)
    weight_current = Column(Float)
    bmi_current = Column(Float)
    bmi_status = Column(String(20))
    cardio_cage = Column(Integer)
    step_up_value = Column(Integer)
    push_up_value = Column(Integer)
    sit_up_value = Column(Integer)
    chin_up_value = Column(Integer)
    sit_reach_value = Column(Float)  # ← changed to Float

    # Add these computed fields so they can be saved
    weight_ideal = Column(Float)
    weight_excess = Column(Float)
    weight_deficit = Column(Float)
    weight_status = Column(String(50))

    bmi_ideal = Column(Float)
    bmi_excess = Column(Float)
    bmi_deficit = Column(Float)
    bmi_points = Column(Integer)

    cardio_type = Column(String(20))
    cardio_value = Column(Integer)
    cardio_ideal = Column(Integer)
    cardio_status = Column(String(20))
    cardio_points = Column(Integer)

    step_up_ideal = Column(Integer)
    step_up_status = Column(String(20))
    step_up_points = Column(Integer)

    push_up_ideal = Column(Integer)
    push_up_status = Column(String(20))
    push_up_points = Column(Integer)

    sit_up_ideal = Column(Integer)
    sit_up_status = Column(String(20))
    sit_up_points = Column(Integer)

    chin_up_ideal = Column(Integer)
    chin_up_status = Column(String(20))
    chin_up_points = Column(Integer)

    sit_reach_ideal = Column(Float)
    sit_reach_status = Column(String(20))
    sit_reach_points = Column(Integer)

    aggregate = Column(Float)
    grade = Column(String(20))
    prescription_duration = Column(String(50))
    prescription_days = Column(String(50))
    recommended_activity = Column(String(255))

    evaluator_name = Column(String(100))
    evaluator_rank = Column(String(50))
    notes = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('svc_no', 'year', name='uq_svc_no_year'),
    )