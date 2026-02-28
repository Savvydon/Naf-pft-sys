from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

class PFTResult(Base):
    __tablename__ = "pft_results"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150))
    rank = Column(String(100))
    svc_no = Column(String(50), index=True)
    unit = Column(String(150))
    appointment = Column(String(150))
    age = Column(Integer)
    sex = Column(String(10))

    height = Column(Float)

    weight_current = Column(Float)
    weight_ideal = Column(Float)
    weight_excess = Column(Float)
    weight_deficit = Column(Float)
    weight_status = Column(String(50))

    bmi_current = Column(Float)
    bmi_ideal = Column(Float)
    bmi_excess = Column(Float)
    bmi_deficit = Column(Float)
    bmi_status = Column(String(50))

    # cardio_time = Column(String(20))
    cardio_ideal = Column(Float)
    # cardio_status = Column(String(50))
    cardio_cage = Column(String(50))

    step_up_value = Column(Integer)
    step_up_ideal = Column(Integer)
    step_up_status = Column(String(50))

    push_up_value = Column(Integer)
    push_up_ideal = Column(Integer)
    push_up_status = Column(String(50))

    sit_up_value = Column(Integer)
    sit_up_ideal = Column(Integer)
    sit_up_status = Column(String(50))

    chin_up_value = Column(Integer)
    chin_up_ideal = Column(Integer)
    chin_up_status = Column(String(50))

    sit_reach_value = Column(Float)
    sit_reach_ideal = Column(Float)
    sit_reach_status = Column(String(50))

    aggregate = Column(Float)
    grade = Column(String(50))

    prescription_duration = Column(String(100))
    prescription_days = Column(String(100))
    recommended_activity = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
