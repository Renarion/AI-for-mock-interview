"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.services.auth import AuthService
from app.schemas.user import UserCreate, UserResponse, UserStatus

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Dependency to get current authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    auth_service = AuthService(db)
    
    payload = await auth_service.verify_clerk_token(token)
    if not payload:
        return None
    
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        return None
    
    user = await auth_service.get_or_create_user(clerk_user_id)
    return user


async def require_auth(
    user = Depends(get_current_user),
):
    """Dependency that requires authentication."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user from Clerk."""
    auth_service = AuthService(db)
    user = await auth_service.get_or_create_user(
        clerk_user_id=user_data.clerk_user_id,
        metadata={
            "os": user_data.os,
            "country": user_data.country,
            "city": user_data.city,
            "registration_type": user_data.registration_type,
        }
    )
    return user


@router.get("/status", response_model=UserStatus)
async def get_user_status(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's status."""
    if not user:
        return UserStatus(
            is_authenticated=False,
            has_trial=False,
            questions_remaining=0,
            user_type="new",
        )
    
    auth_service = AuthService(db)
    return await auth_service.get_user_status(user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user = Depends(require_auth),
):
    """Get current user info."""
    return user
