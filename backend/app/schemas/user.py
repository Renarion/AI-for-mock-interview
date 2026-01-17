"""User-related schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    clerk_user_id: str
    os: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    registration_type: str = "google"


class UserResponse(BaseModel):
    """Schema for user response."""
    user_id: str
    created_dttm: datetime
    trial_question_flg: bool
    paid_questions_number_left: int
    
    class Config:
        from_attributes = True


class UserStatus(BaseModel):
    """Schema for user status check."""
    is_authenticated: bool
    has_trial: bool
    questions_remaining: int
    user_type: str  # new, trial, paid, expired
