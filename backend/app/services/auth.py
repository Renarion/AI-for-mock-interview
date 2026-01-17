"""Authentication service using Clerk."""
import httpx
from jose import jwt, JWTError
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.models.user import User

settings = get_settings()


class AuthService:
    """Service for handling authentication via Clerk."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def verify_clerk_token(self, token: str) -> Optional[dict]:
        """
        Verify Clerk JWT token and return user data.
        
        In production, this should verify the JWT signature using Clerk's JWKS.
        For now, this is a simplified implementation.
        """
        try:
            # TODO: Implement proper JWT verification with Clerk JWKS
            # For development, decode without verification
            if settings.debug:
                payload = jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
                return payload
            
            # Production: Verify with Clerk's public key
            # JWKS endpoint: https://<clerk-domain>/.well-known/jwks.json
            async with httpx.AsyncClient() as client:
                jwks_url = f"{settings.clerk_jwt_issuer}/.well-known/jwks.json"
                response = await client.get(jwks_url)
                jwks = response.json()
                
                # Verify JWT with JWKS
                # This is a placeholder - implement proper JWKS verification
                unverified_header = jwt.get_unverified_header(token)
                # ... verification logic ...
                
            return None
        except JWTError:
            return None
    
    async def get_or_create_user(
        self, 
        clerk_user_id: str,
        metadata: Optional[dict] = None
    ) -> User:
        """Get existing user or create a new one."""
        # Try to find existing user
        result = await self.db.execute(
            select(User).where(User.clerk_user_id == clerk_user_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            return user
        
        # Create new user with trial access
        import uuid
        user = User(
            user_id=str(uuid.uuid4()),
            clerk_user_id=clerk_user_id,
            trial_question_flg=True,
            paid_questions_number_left=0,
            os=metadata.get("os") if metadata else None,
            country=metadata.get("country") if metadata else None,
            city=metadata.get("city") if metadata else None,
            registration_type=metadata.get("registration_type", "google") if metadata else "google",
        )
        
        self.db.add(user)
        await self.db.flush()
        
        return user
    
    async def get_user_status(self, user: User) -> dict:
        """Get user's current status for frontend."""
        if user.paid_questions_number_left > 0:
            user_type = "paid"
        elif user.trial_question_flg:
            user_type = "trial"
        else:
            user_type = "expired"
        
        return {
            "is_authenticated": True,
            "has_trial": user.trial_question_flg,
            "questions_remaining": user.paid_questions_number_left + (3 if user.trial_question_flg else 0),
            "user_type": user_type,
        }
    
    async def consume_trial(self, user: User) -> bool:
        """Mark trial as used."""
        if not user.trial_question_flg:
            return False
        
        user.trial_question_flg = False
        await self.db.flush()
        return True
    
    async def consume_paid_question(self, user: User) -> bool:
        """Consume one paid question from user's balance."""
        if user.paid_questions_number_left <= 0:
            return False
        
        user.paid_questions_number_left -= 1
        await self.db.flush()
        return True
