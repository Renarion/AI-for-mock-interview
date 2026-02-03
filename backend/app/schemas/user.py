"""User-related schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    """Schema for registration."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    telegram_username: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=72)


class LoginRequest(BaseModel):
    """Schema for login (email or telegram + password)."""
    login: str = Field(..., min_length=1, max_length=255)  # email or telegram username
    password: str = Field(..., max_length=72)


class UserResponse(BaseModel):
    """Schema for user response (public)."""
    user_id: str
    name: str
    email: str
    telegram_username: Optional[str] = None
    created_dttm: datetime
    trial_question_flg: bool
    paid_questions_number_left: int
    questions_remaining: int  # 1 if trial else 0 + paid

    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    """Schema for /auth/me: user data for profile (password masked)."""
    user_id: str
    name: str
    email: str
    telegram_username: Optional[str] = None
    password_masked: str  # e.g. "********"
    questions_remaining: int
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


class AuthResponse(BaseModel):
    """Schema for login/register response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
