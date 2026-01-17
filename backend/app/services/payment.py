"""Payment service using YooKassa."""
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PricingPlan, PaymentCreate, PaymentResponse

settings = get_settings()

# Pricing plans
PRICING_PLANS = {
    "3_questions": PricingPlan(
        plan_id="3_questions",
        name="Starter",
        questions_count=3,
        price=299.0,
        currency="RUB",
        description="3 вопроса для практики",
    ),
    "6_questions": PricingPlan(
        plan_id="6_questions",
        name="Standard",
        questions_count=6,
        price=499.0,
        currency="RUB",
        description="6 вопросов — лучшая практика",
    ),
    "12_questions": PricingPlan(
        plan_id="12_questions",
        name="Pro",
        questions_count=12,
        price=899.0,
        currency="RUB",
        description="12 вопросов для серьёзной подготовки",
    ),
    "24_questions": PricingPlan(
        plan_id="24_questions",
        name="Ultimate",
        questions_count=24,
        price=1499.0,
        currency="RUB",
        description="24 вопроса — максимальная подготовка",
    ),
}


class PaymentService:
    """Service for handling payments via YooKassa."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._init_yookassa()
    
    def _init_yookassa(self):
        """Initialize YooKassa configuration."""
        # TODO: Initialize YooKassa SDK when credentials are available
        # from yookassa import Configuration
        # Configuration.account_id = settings.yookassa_shop_id
        # Configuration.secret_key = settings.yookassa_secret_key
        pass
    
    def get_pricing_plans(self) -> list[PricingPlan]:
        """Get all available pricing plans."""
        return list(PRICING_PLANS.values())
    
    async def create_payment(
        self,
        user: User,
        payment_data: PaymentCreate,
        ip_address: Optional[str] = None,
    ) -> PaymentResponse:
        """Create a new payment via YooKassa."""
        plan = PRICING_PLANS.get(payment_data.plan_id)
        if not plan:
            raise ValueError("Invalid plan ID")
        
        payment_id = str(uuid.uuid4())
        
        # TODO: Create actual YooKassa payment
        # from yookassa import Payment as YKPayment
        # yookassa_payment = YKPayment.create({
        #     "amount": {
        #         "value": str(plan.price),
        #         "currency": plan.currency
        #     },
        #     "confirmation": {
        #         "type": "redirect",
        #         "return_url": payment_data.return_url or f"{settings.frontend_url}/payment/success"
        #     },
        #     "capture": True,
        #     "description": f"Mock Interview: {plan.name}",
        #     "metadata": {
        #         "user_id": user.user_id,
        #         "plan_id": plan.plan_id,
        #     }
        # })
        
        # For development, create a mock payment
        confirmation_url = f"{settings.frontend_url}/payment/mock?payment_id={payment_id}"
        
        # Save payment record
        payment = Payment(
            user_id=user.user_id,
            transaction_id=payment_id,
            status="pending",
            transaction_sum=plan.price,
            payment_provider="yookassa",
            product_id=plan.plan_id,
            currency=plan.currency,
            ip_address=ip_address,
        )
        self.db.add(payment)
        await self.db.flush()
        
        return PaymentResponse(
            payment_id=payment_id,
            confirmation_url=confirmation_url,
            status="pending",
            amount=plan.price,
            currency=plan.currency,
        )
    
    async def process_webhook(self, webhook_data: dict) -> bool:
        """Process YooKassa webhook notification."""
        event_type = webhook_data.get("event")
        payment_object = webhook_data.get("object", {})
        
        if event_type != "payment.succeeded":
            return True  # Ignore other events
        
        payment_id = payment_object.get("id")
        metadata = payment_object.get("metadata", {})
        
        # Find payment in database
        result = await self.db.execute(
            select(Payment).where(Payment.transaction_id == payment_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            return False
        
        # Update payment status
        payment.status = "succeeded"
        payment.payment_type = payment_object.get("payment_method", {}).get("type")
        
        # Credit questions to user
        plan = PRICING_PLANS.get(payment.product_id)
        if plan:
            result = await self.db.execute(
                select(User).where(User.user_id == payment.user_id)
            )
            user = result.scalar_one_or_none()
            
            if user:
                user.paid_questions_number_left += plan.questions_count
        
        await self.db.flush()
        return True
    
    async def mock_complete_payment(self, payment_id: str) -> bool:
        """
        Mock payment completion for development.
        In production, this would be handled by YooKassa webhook.
        """
        result = await self.db.execute(
            select(Payment).where(Payment.transaction_id == payment_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            return False
        
        payment.status = "succeeded"
        
        # Credit questions to user
        plan = PRICING_PLANS.get(payment.product_id)
        if plan:
            result = await self.db.execute(
                select(User).where(User.user_id == payment.user_id)
            )
            user = result.scalar_one_or_none()
            
            if user:
                user.paid_questions_number_left += plan.questions_count
        
        await self.db.flush()
        return True
