"""Authentication routes: register, login, JWT."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.services.auth import AuthService, decode_token
from app.schemas.user import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    UserResponse,
    UserStatus,
    UserMeResponse,
    AuthResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Dependency to get current authenticated user from JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    user_id = decode_token(token)
    if not user_id:
        return None
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    return user


async def require_auth(
    user=Depends(get_current_user),
):
    """Dependency that requires authentication."""
    if not user:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    return user


def _user_response(user) -> UserResponse:
    trial = getattr(user, 'trial_questions_left', 1 if user.trial_question_flg else 0)
    q = trial + user.paid_questions_number_left
    return UserResponse(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        telegram_username=user.telegram_username,
        created_dttm=user.created_dttm,
        trial_question_flg=trial > 0,
        paid_questions_number_left=user.paid_questions_number_left,
        questions_remaining=q,
    )


@router.post("/register", response_model=AuthResponse)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (email required, telegram optional)."""
    auth_service = AuthService(db)
    try:
        user = await auth_service.register(
            name=body.name,
            email=body.email,
            password=body.password,
            telegram_username=body.telegram_username,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    from app.services.auth import create_access_token
    token = create_access_token(user.user_id)
    return AuthResponse(
        access_token=token,
        user=_user_response(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login by email or telegram username + password."""
    auth_service = AuthService(db)
    user = await auth_service.login(login=body.login, password=body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    from app.services.auth import create_access_token
    token = create_access_token(user.user_id)
    return AuthResponse(
        access_token=token,
        user=_user_response(user),
    )


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password without verification by login (email or telegram)."""
    auth_service = AuthService(db)
    updated = await auth_service.reset_password_by_login(
        login=body.login,
        new_password=body.new_password,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"message": "Пароль успешно обновлён"}


@router.get("/status", response_model=UserStatus)
async def get_status(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's status (works without auth: returns new)."""
    if not user:
        return UserStatus(
            is_authenticated=False,
            has_trial=False,
            questions_remaining=0,
            user_type="new",
        )
    auth_service = AuthService(db)
    status = await auth_service.get_user_status(user)
    return UserStatus(**status)


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    user=Depends(require_auth),
):
    """Get current user info for profile (password masked)."""
    trial = getattr(user, 'trial_questions_left', 1 if user.trial_question_flg else 0)
    q = trial + user.paid_questions_number_left
    pl = getattr(user, "password_length", None)
    return UserMeResponse(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        telegram_username=user.telegram_username,
        password_masked="••••••••",
        password_length=pl,
        questions_remaining=q,
        trial_question_flg=trial > 0,
        paid_questions_number_left=user.paid_questions_number_left,
    )
