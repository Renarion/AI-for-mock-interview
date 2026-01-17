"""User model for storing user information."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer
from app.database import Base


class User(Base):
    """
    User table for storing user information.
    Used to check trial attempts and paid questions remaining.
    """
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True, index=True)
    created_dttm = Column(DateTime, default=datetime.utcnow)
    trial_question_flg = Column(Boolean, default=True)  # True = trial available
    paid_questions_number_left = Column(Integer, default=0)
    os = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    registration_type = Column(String, default="google")  # google, email, etc.
    
    # Clerk user ID for linking
    clerk_user_id = Column(String, unique=True, nullable=True)
