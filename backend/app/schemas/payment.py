"""Payment-related schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PricingPlan(BaseModel):
    """Schema for pricing plan."""
    plan_id: str
    name: str
    questions_count: int
    price: float
    currency: str = "RUB"
    description: Optional[str] = None


class PaymentCreate(BaseModel):
    """Schema for creating a payment."""
    plan_id: str
    return_url: Optional[str] = None


class PaymentResponse(BaseModel):
    """Schema for payment response."""
    payment_id: str
    confirmation_url: str
    status: str
    amount: float
    currency: str


class PaymentWebhook(BaseModel):
    """Schema for payment webhook from YooKassa."""
    type: str
    event: str
    object: dict
