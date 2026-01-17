"""Payment model for transaction records."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey
from app.database import Base


class Payment(Base):
    """
    Payment table for storing transaction information.
    Used for tracking payments and debugging issues.
    """
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    transaction_id = Column(String, unique=True, nullable=False)
    payment_dttm = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, succeeded, failed, refunded
    transaction_sum = Column(Float, nullable=False)
    payment_provider = Column(String, default="yookassa")
    payment_type = Column(String, nullable=True)  # card, wallet, etc.
    product_id = Column(String, nullable=False)  # 3_questions, 6_questions, etc.
    currency = Column(String, default="RUB")
    ip_address = Column(String, nullable=True)
