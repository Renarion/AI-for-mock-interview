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
    # Display name
    name = Column(String, nullable=False)
    # Login: email (required) and telegram (optional)
    email = Column(String, unique=True, nullable=False, index=True)
    telegram_username = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=False)
    # Entitlements: 1 free question for new users (trial_question_flg), then paid
    trial_question_flg = Column(Boolean, default=True)  # True = 1 free question available
    paid_questions_number_left = Column(Integer, default=0)
    os = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    registration_type = Column(String, default="email")
