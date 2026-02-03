"""Authentication service: JWT + Argon2 password hashing (no length limit)."""
import uuid
from datetime import datetime, timedelta
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.config import get_settings
from app.models.user import User

settings = get_settings()
_ph = PasswordHasher(time_cost=2, memory_cost=65536)  # reasonable for web app


def hash_password(password: str) -> str:
    """Hash password with Argon2 (supports any length)."""
    return _ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against Argon2 hash."""
    try:
        _ph.verify(hashed, plain)
        return True
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(days=30)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm="HS256",
    )


def decode_token(token: str) -> Optional[str]:
    """Decode JWT token, return user_id or None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None


class AuthService:
    """Registration, login, JWT verification."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(
        self,
        name: str,
        email: str,
        password: str,
        telegram_username: Optional[str] = None,
    ) -> User:
        """Register a new user."""
        email_lower = email.strip().lower()
        if telegram_username:
            telegram_username = telegram_username.strip().lstrip("@")

        r = await self.db.execute(select(User).where(User.email == email_lower))
        if r.scalar_one_or_none():
            raise ValueError("Пользователь с такой почтой уже зарегистрирован")

        if telegram_username:
            r2 = await self.db.execute(
                select(User).where(User.telegram_username == telegram_username)
            )
            if r2.scalar_one_or_none():
                raise ValueError("Этот ник в Telegram уже используется")

        user = User(
            user_id=str(uuid.uuid4()),
            name=name.strip(),
            email=email_lower,
            telegram_username=telegram_username or None,
            password_hash=hash_password(password),
            trial_question_flg=True,
            paid_questions_number_left=0,
            registration_type="email",
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def login(self, login: str, password: str) -> Optional[User]:
        """Login by email or telegram username."""
        login_clean = login.strip().lower().lstrip("@")
        r = await self.db.execute(
            select(User).where(
                or_(
                    User.email == login_clean,
                    User.telegram_username == login_clean,
                )
            )
        )
        user = r.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            return None
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by user_id."""
        r = await self.db.execute(select(User).where(User.user_id == user_id))
        return r.scalar_one_or_none()

    async def get_user_status(self, user: User) -> dict:
        """Get user status for frontend."""
        q = (1 if user.trial_question_flg else 0) + user.paid_questions_number_left
        if q > 0:
            user_type = "paid" if user.paid_questions_number_left > 0 else "trial"
        elif user.trial_question_flg:
            user_type = "trial"
        else:
            user_type = "expired"
        return {
            "is_authenticated": True,
            "has_trial": user.trial_question_flg,
            "questions_remaining": q,
            "user_type": user_type,
        }

    async def consume_one_question(self, user: User) -> bool:
        """Consume one question (trial first, then paid)."""
        if user.trial_question_flg:
            user.trial_question_flg = False
            await self.db.flush()
            return True
        if user.paid_questions_number_left > 0:
            user.paid_questions_number_left -= 1
            await self.db.flush()
            return True
        return False

    async def add_paid_questions(self, user: User, count: int) -> None:
        """Add paid questions to user balance."""
        user.paid_questions_number_left += count
        await self.db.flush()
