"""Interview-related schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InterviewStart(BaseModel):
    """Schema for starting an interview session."""
    selection: dict  # TaskSelection data
    session_id: Optional[str] = None


class InterviewAnswer(BaseModel):
    """Schema for submitting an answer."""
    session_id: str
    task_id: int
    answer: str = Field(..., max_length=3000)  # Limit answer length
    time_spent_seconds: Optional[int] = None


class TaskFeedback(BaseModel):
    """Schema for individual task feedback."""
    task_id: int
    task_question: str
    user_answer: str
    score: int = Field(..., ge=0, le=100)
    strengths: List[str]
    improvements: List[str]
    detailed_feedback: str


class InterviewFeedback(BaseModel):
    """Schema for interview feedback response."""
    feedback_id: str
    task_feedback: TaskFeedback
    can_continue: bool
    tasks_completed: int
    tasks_remaining: int


class FinalReport(BaseModel):
    """Schema for final interview report."""
    session_id: str
    overall_score: int = Field(..., ge=0, le=100)
    task_feedbacks: List[TaskFeedback]
    overall_strengths: List[str]
    areas_to_improve: List[str]
    study_recommendations: List[str]
    motivational_message: str
    completed_at: datetime


class InterviewSession(BaseModel):
    """Schema for interview session state."""
    session_id: str
    user_id: str
    selection: dict
    tasks: List[dict]
    current_task_index: int
    answers: List[dict]
    started_at: datetime
    status: str  # active, completed, abandoned
