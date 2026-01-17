"""Payment routes."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.routers.auth import require_auth
from app.services.payment import PaymentService
from app.schemas.payment import PaymentCreate, PaymentResponse, PricingPlan

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.get("/plans")
async def get_pricing_plans(
    db: AsyncSession = Depends(get_db),
):
    """Get all available pricing plans."""
    payment_service = PaymentService(db)
    plans = payment_service.get_pricing_plans()
    return {"plans": [plan.model_dump() for plan in plans]}


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    payment_data: PaymentCreate,
    request: Request,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Create a new payment."""
    payment_service = PaymentService(db)
    
    # Get client IP
    ip_address = request.client.host if request.client else None
    
    try:
        payment = await payment_service.create_payment(
            user=user,
            payment_data=payment_data,
            ip_address=ip_address,
        )
        return payment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle YooKassa webhook notifications."""
    # TODO: Verify webhook signature from YooKassa
    try:
        webhook_data = await request.json()
        payment_service = PaymentService(db)
        
        success = await payment_service.process_webhook(webhook_data)
        
        if success:
            return {"status": "ok"}
        else:
            raise HTTPException(status_code=400, detail="Failed to process webhook")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/mock-complete/{payment_id}")
async def mock_complete_payment(
    payment_id: str,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Mock payment completion for development.
    This endpoint should be removed in production!
    """
    payment_service = PaymentService(db)
    
    success = await payment_service.mock_complete_payment(payment_id)
    
    if success:
        return {"status": "success", "message": "Payment completed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Payment not found")
