"""Task-related schemas."""
from typing import Optional, List
from pydantic import BaseModel


class TaskSelection(BaseModel):
    """Schema for task selection parameters."""
    specialization: str  # product_analyst, data_analyst
    experience_level: str  # junior, middle, senior
    company_tier: str  # tier1, tier2
    topic: str  # statistics, ab_testing, probability, python, sql, random


class TaskResponse(BaseModel):
    """Schema for task response."""
    task_id: int
    task_question: str
    task_number: int  # 1, 2, or 3 in the session
    total_tasks: int  # Always 3
    time_limit_minutes: int = 20
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for list of tasks in a session."""
    tasks: List[TaskResponse]
    session_id: str
