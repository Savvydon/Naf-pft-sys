from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    step_up_excess = Column(Integer)
    step_up_deficit = Column(Integer)
    step_up_points = Column(Integer)
    push_up_value = Column(Integer)
    push_up_ideal = Column(JSON)
    push_up_excess = Column(Integer)
    push_up_deficit = Column(Integer)
    push_up_status = Column(String(20))
    push_up_points = Column(Integer)
    sit_up_value = Column(Integer)
    sit_up_ideal = Column(JSON)
    sit_up_excess = Column(Integer)
    sit_up_deficit = Column(Integer)
    sit_up_status = Column(String(20))
    sit_up_points = Column(Integer)
    chin_up_value = Column(Integer)
    chin_up_ideal = Column(JSON)
    chin_up_status = Column(String(20))
    chin_up_excess = Column(Integer)
    chin_up_deficit = Column(Integer)
    chin_up_points = Column(Integer)
    sit_reach_value = Column(Float)
    sit_reach_ideal = Column(JSON)
    sit_reach_status = Column(String(20))
    sit_reach_excess = Column(Float)
    sit_reach_deficit = Column(Float)
    sit_reach_points = Column(Integer)
    # Final Results
    aggregate = Column(Float)
    grade = Column(String(20))
    # Prescription / Recommendation
    prescription_duration = Column(String(50))
    prescription_days = Column(String(50))
    recommended_activity = Column(String(255))
    # Evaluator Info
    evaluator_name = Column(String(100), index=True)
    evaluator_rank = Column(String(50))
    notes = Column(String(500), nullable=True)
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
 
    # Prevent duplicate entries
    __table_args__ = (
        UniqueConstraint("svc_no", "year", name="uq_svc_no_year"),
    )

    # Relationship with Certificate (one-to-one)
    certificate = relationship("Certificate", back_populates="pft_result", uselist=False)


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

    # Relationship with Certificate (one-to-many: one user can issue many certificates)
    certificates_issued = relationship("Certificate", back_populates="issuer", foreign_keys="Certificate.issued_by")


# CERTIFICATE MODEL
class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Certificate number (e.g., NAF/786/HQ054991)
    certificate_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Foreign key to PFT result (one-to-one relationship)
    pft_result_id = Column(Integer, ForeignKey("pft_results.id"), nullable=False, unique=True)
    
    # Personnel info (denormalized for certificate display)
    personnel_name = Column(String(100), nullable=False)
    personnel_rank = Column(String(50), nullable=False)
    personnel_svc_no = Column(String(50), nullable=False, index=True)
    personnel_unit = Column(String(100), nullable=False)
    
    # Certificate details
    participated_in = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)  # Fit, Not Fit, Excused
    location = Column(String(255), nullable=False)
    
    # Issue date components
    issued_day = Column(String(10), nullable=False)
    issued_month = Column(String(20), nullable=False)
    issued_year = Column(String(4), nullable=False)
    
    # Issuer info (foreign key to User) - Original creator
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    issuer_name = Column(String(100), nullable=False)
    issuer_rank = Column(String(50), nullable=False)
    
    # Signatories (optional, can be updated later)
    aoc_signatory = Column(String(100), default="AOC/Comd")
    sports_officer_signatory = Column(String(100), default="Sports Offr")
    
    # AUDIT FIELDS - NEW: Track modifications
    last_modified_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    last_modified_by_name = Column(String(100), nullable=True)
    last_modified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pft_result = relationship("PFTResult", back_populates="certificate")
    issuer = relationship("User", foreign_keys=[issued_by], back_populates="certificates_issued")
    last_modifier = relationship("User", foreign_keys=[last_modified_by])
    
    def __repr__(self):
        return f"<Certificate {self.certificate_number}>"

# from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, JSON, ForeignKey
# from sqlalchemy.sql import func
# from sqlalchemy.orm import relationship
# from .database import Base

# # PFT RESULT MODEL
# class PFTResult(Base):
#     __tablename__ = "pft_results"

#     id = Column(Integer, primary_key=True, index=True)
#     # Basic Identity
#     year = Column(Integer, nullable=False, index=True)
#     svc_no = Column(String(50), nullable=False, index=True)
#     full_name = Column(String(100))
#     rank = Column(String(50))
#     unit = Column(String(100))
#     appointment = Column(String(100))
#     email = Column(String(120), nullable=True)
#     date = Column(String(20), nullable=True)
#     age = Column(Integer)
#     sex = Column(String(10))
#     height = Column(Float)
#     weight_current = Column(Float)
#     # BMI
#     bmi_current = Column(Float)
#     bmi_status = Column(String(20))
#     bmi_ideal = Column(JSON)
#     bmi_excess = Column(Float)
#     bmi_deficit = Column(Float)
#     bmi_points = Column(Integer)
#     # Weight Evaluation
#     weight_ideal = Column(Float)
#     weight_excess = Column(Float)
#     weight_deficit = Column(Float)
#     weight_status = Column(String(50))
#     # Cardio
#     cardio_cage = Column(Integer)
#     cardio_type = Column(String(20))
#     cardio_value = Column(Integer)
#     cardio_ideal = Column(JSON)
#     cardio_status = Column(String(20))
#     cardio_points = Column(Integer)
#     # Strength Tests
#     step_up_value = Column(Integer)
#     step_up_ideal = Column(JSON)
#     step_up_status = Column(String(20))
#     step_up_excess = Column(Integer)
#     step_up_deficit = Column(Integer)
#     step_up_points = Column(Integer)
#     push_up_value = Column(Integer)
#     push_up_ideal = Column(JSON)
#     push_up_excess = Column(Integer)
#     push_up_deficit = Column(Integer)
#     push_up_status = Column(String(20))
#     push_up_points = Column(Integer)
#     sit_up_value = Column(Integer)
#     sit_up_ideal = Column(JSON)
#     sit_up_excess = Column(Integer)
#     sit_up_deficit = Column(Integer)
#     sit_up_status = Column(String(20))
#     sit_up_points = Column(Integer)
#     chin_up_value = Column(Integer)
#     chin_up_ideal = Column(JSON)
#     chin_up_status = Column(String(20))
#     chin_up_excess = Column(Integer)
#     chin_up_deficit = Column(Integer)
#     chin_up_points = Column(Integer)
#     sit_reach_value = Column(Float)
#     sit_reach_ideal = Column(JSON)
#     sit_reach_status = Column(String(20))
#     sit_reach_excess = Column(Float)
#     sit_reach_deficit = Column(Float)
#     sit_reach_points = Column(Integer)
#     # Final Results
#     aggregate = Column(Float)
#     grade = Column(String(20))
#     # Prescription / Recommendation
#     prescription_duration = Column(String(50))
#     prescription_days = Column(String(50))
#     recommended_activity = Column(String(255))
#     # Evaluator Info
#     evaluator_name = Column(String(100), index=True)  # Added index for faster queries
#     evaluator_rank = Column(String(50))
#     notes = Column(String(500), nullable=True)
#     # Metadata
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
 
#     # Prevent duplicate entries
#     __table_args__ = (
#         UniqueConstraint("svc_no", "year", name="uq_svc_no_year"),
#     )

#     # Relationship with Certificate
#     certificate = relationship("Certificate", backref="pft_result", uselist=False)

# # USER MODEL (AUTH SYSTEM)
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     svc_no = Column(String(50), unique=True, nullable=False, index=True)
#     full_name = Column(String(100), nullable=False)
#     rank = Column(String(50), nullable=False)
#     email = Column(String(120), unique=True, index=True, nullable=True)
#     hashed_password = Column(String(255), nullable=False)
#     role = Column(
#         String(30),
#         default="evaluator"
#     )  # evaluator / admin / super_admin

#     created_at = Column(DateTime(timezone=True), server_default=func.now())



# from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, JSON, ForeignKey
# from sqlalchemy.sql import func
# from sqlalchemy.orm import relationship
# from .database import Base

# # PFT RESULT MODEL
# class PFTResult(Base):
#     __tablename__ = "pft_results"

#     id = Column(Integer, primary_key=True, index=True)
#     # Basic Identity
#     year = Column(Integer, nullable=False, index=True)
#     svc_no = Column(String(50), nullable=False, index=True)
#     full_name = Column(String(100))
#     rank = Column(String(50))
#     unit = Column(String(100))
#     appointment = Column(String(100))
#     email = Column(String(120), nullable=True)
#     date = Column(String(20), nullable=True)
#     age = Column(Integer)
#     sex = Column(String(10))
#     height = Column(Float)
#     weight_current = Column(Float)
#     # BMI
#     bmi_current = Column(Float)
#     bmi_status = Column(String(20))
#     bmi_ideal = Column(JSON)
#     bmi_excess = Column(Float)
#     bmi_deficit = Column(Float)
#     bmi_points = Column(Integer)
#     # Weight Evaluation
#     weight_ideal = Column(Float)
#     weight_excess = Column(Float)
#     weight_deficit = Column(Float)
#     weight_status = Column(String(50))
#     # Cardio
#     cardio_cage = Column(Integer)
#     cardio_type = Column(String(20))
#     cardio_value = Column(Integer)
#     cardio_ideal = Column(JSON)
#     cardio_status = Column(String(20))
#     cardio_points = Column(Integer)
#     # Strength Tests
#     step_up_value = Column(Integer)
#     step_up_ideal = Column(JSON)
#     step_up_status = Column(String(20))
#     step_up_excess = Column(Integer)
#     step_up_deficit = Column(Integer)
#     step_up_points = Column(Integer)
#     push_up_value = Column(Integer)
#     push_up_ideal = Column(JSON)
#     push_up_excess = Column(Integer)
#     push_up_deficit = Column(Integer)
#     push_up_status = Column(String(20))
#     push_up_points = Column(Integer)
#     sit_up_value = Column(Integer)
#     sit_up_ideal = Column(JSON)
#     sit_up_excess = Column(Integer)
#     sit_up_deficit = Column(Integer)
#     sit_up_status = Column(String(20))
#     sit_up_points = Column(Integer)
#     chin_up_value = Column(Integer)
#     chin_up_ideal = Column(JSON)
#     chin_up_status = Column(String(20))
#     chin_up_excess = Column(Integer)
#     chin_up_deficit = Column(Integer)
#     chin_up_points = Column(Integer)
#     sit_reach_value = Column(Float)
#     sit_reach_ideal = Column(JSON)
#     sit_reach_status = Column(String(20))
#     sit_reach_excess = Column(Float)
#     sit_reach_deficit = Column(Float)
#     sit_reach_points = Column(Integer)
#     # Final Results
#     aggregate = Column(Float)
#     grade = Column(String(20))
#     # Prescription / Recommendation
#     prescription_duration = Column(String(50))
#     prescription_days = Column(String(50))
#     recommended_activity = Column(String(255))
#     # Evaluator Info
#     evaluator_name = Column(String(100), index=True)
#     evaluator_rank = Column(String(50))
#     notes = Column(String(500), nullable=True)
#     # Metadata
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
 
#     # Prevent duplicate entries
#     __table_args__ = (
#         UniqueConstraint("svc_no", "year", name="uq_svc_no_year"),
#     )

#     # Relationship with Certificate (one-to-one)
#     certificate = relationship("Certificate", back_populates="pft_result", uselist=False)


# # USER MODEL (AUTH SYSTEM)
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     svc_no = Column(String(50), unique=True, nullable=False, index=True)
#     full_name = Column(String(100), nullable=False)
#     rank = Column(String(50), nullable=False)
#     email = Column(String(120), unique=True, index=True, nullable=True)
#     hashed_password = Column(String(255), nullable=False)
#     role = Column(
#         String(30),
#         default="evaluator"
#     )  # evaluator / admin / super_admin

#     created_at = Column(DateTime(timezone=True), server_default=func.now())

#     # Relationship with Certificate (one-to-many: one user can issue many certificates)
#     certificates_issued = relationship("Certificate", back_populates="issuer")


# # CERTIFICATE MODEL
# class Certificate(Base):
#     __tablename__ = "certificates"
    
#     id = Column(Integer, primary_key=True, index=True)
    
#     # Certificate number (e.g., NAF/786/HQ054991)
#     certificate_number = Column(String(50), unique=True, nullable=False, index=True)
    
#     # Foreign key to PFT result (one-to-one relationship)
#     pft_result_id = Column(Integer, ForeignKey("pft_results.id"), nullable=False, unique=True)
    
#     # Personnel info (denormalized for certificate display)
#     personnel_name = Column(String(100), nullable=False)
#     personnel_rank = Column(String(50), nullable=False)
#     personnel_svc_no = Column(String(50), nullable=False, index=True)
#     personnel_unit = Column(String(100), nullable=False)
    
#     # Certificate details
#     participated_in = Column(String(255), nullable=False)
#     status = Column(String(20), nullable=False)  # Fit, Not Fit, Excused
#     location = Column(String(255), nullable=False)
    
#     # Issue date components
#     issued_day = Column(String(10), nullable=False)
#     issued_month = Column(String(20), nullable=False)
#     issued_year = Column(String(4), nullable=False)
    
#     # Issuer info (foreign key to User)
#     issued_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
#     issuer_name = Column(String(100), nullable=False)
#     issuer_rank = Column(String(50), nullable=False)
    
#     # Signatories (optional, can be updated later)
#     aoc_signatory = Column(String(100), default="AOC/Comd")
#     sports_officer_signatory = Column(String(100), default="Sports Offr")
    
#     # Timestamps
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
#     # Relationships
#     pft_result = relationship("PFTResult", back_populates="certificate")
#     issuer = relationship("User", back_populates="certificates_issued")
    
#     def __repr__(self):
#         return f"<Certificate {self.certificate_number}>"