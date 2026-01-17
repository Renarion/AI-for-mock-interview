"""LLM Answer model for storing AI feedback."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, JSON
from app.database import Base


class LLMAnswer(Base):
    """
    LLM Answers table for storing AI-generated feedback.
    Used for quality validation and template tuning.
    """
    __tablename__ = "llm_answers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    created_dttm = Column(DateTime, default=datetime.utcnow)
    feedback_id = Column(String, unique=True, nullable=False)
    feedback_json = Column(JSON, nullable=True)  # Structured feedback data
    provided_feedback = Column(Text, nullable=True)  # Raw text feedback
    task_id = Column(Integer, ForeignKey("tasks.task_id"), nullable=True)
    user_answer = Column(Text, nullable=True)  # User's original answer
