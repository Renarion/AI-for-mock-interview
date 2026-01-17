"""API routers."""
from app.routers.auth import router as auth_router
from app.routers.interview import router as interview_router
from app.routers.payment import router as payment_router

__all__ = ["auth_router", "interview_router", "payment_router"]
