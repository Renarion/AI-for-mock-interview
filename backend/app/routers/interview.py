"""Interview routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.routers.auth import require_auth
from app.services.interview import InterviewService
from app.services.auth import AuthService
from app.schemas.task import TaskSelection, TaskResponse
from app.schemas.interview import (
    InterviewStart,
    InterviewAnswer,
    InterviewFeedback,
    FinalReport,
)

router = APIRouter(prefix="/interview", tags=["Interview"])


@router.post("/start")
async def start_interview(
    selection: TaskSelection,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Start a new interview session."""
    interview_service = InterviewService(db)
    
    try:
        session_id, tasks = await interview_service.start_interview(user, selection)
        
        return {
            "session_id": session_id,
            "tasks": [task.model_dump() for task in tasks],
            "message": "Интервью начинается! У вас будет 3 задачи. На каждую задачу рекомендуется уложиться в 20 минут.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get current session state."""
    interview_service = InterviewService(db)
    session = interview_service.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    current_task = interview_service.get_current_task(session_id)
    can_continue, completed, remaining = interview_service.can_continue(session_id)
    
    return {
        "session_id": session_id,
        "status": session["status"],
        "current_task": current_task,
        "tasks_completed": completed,
        "tasks_remaining": remaining,
        "can_continue": can_continue,
        "feedbacks": session.get("feedbacks", []),
    }


@router.get("/session/{session_id}/task")
async def get_current_task(
    session_id: str,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get current task for the session."""
    interview_service = InterviewService(db)
    session = interview_service.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    current_task = interview_service.get_current_task(session_id)
    
    if not current_task:
        raise HTTPException(
            status_code=400, 
            detail="No more tasks available or session is complete"
        )
    
    return current_task


@router.post("/session/{session_id}/answer")
async def submit_answer(
    session_id: str,
    answer_data: InterviewAnswer,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Submit answer for current task."""
    if answer_data.session_id != session_id:
        raise HTTPException(status_code=400, detail="Session ID mismatch")
    
    interview_service = InterviewService(db)
    session = interview_service.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        feedback = await interview_service.submit_answer(
            session_id=session_id,
            task_id=answer_data.task_id,
            answer=answer_data.answer,
            user=user,
        )
        # Consume one question per submitted answer
        auth_service = AuthService(db)
        await auth_service.consume_one_question(user)
        
        can_continue, completed, remaining = interview_service.can_continue(session_id)
        
        return {
            "feedback": feedback.model_dump(),
            "can_continue": can_continue,
            "tasks_completed": completed,
            "tasks_remaining": remaining,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/session/{session_id}/finish")
async def finish_interview(
    session_id: str,
    user = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Finish interview and get final report."""
    interview_service = InterviewService(db)
    session = interview_service.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        report = await interview_service.finish_interview(session_id, user)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/specializations")
async def get_specializations():
    """Get available specializations."""
    return {
        "specializations": [
            {"id": "product_analyst", "name": "Product Analyst"},
            {"id": "data_analyst", "name": "Data Analyst"},
        ]
    }


@router.get("/experience-levels")
async def get_experience_levels():
    """Get available experience levels."""
    return {
        "levels": [
            {"id": "junior", "name": "Junior"},
            {"id": "middle", "name": "Middle"},
            {"id": "senior", "name": "Senior"},
        ]
    }


@router.get("/company-tiers")
async def get_company_tiers():
    """Get available company tiers."""
    return {
        "tiers": [
            {
                "id": "tier1", 
                "name": "Tier 1",
                "description": "Яндекс, VK, Тинькофф, Ozon, Avito и др."
            },
            {
                "id": "tier2", 
                "name": "Tier 2",
                "description": "Крупные компании с сильными командами"
            },
        ]
    }


@router.get("/topics")
async def get_topics():
    """Get available interview topics."""
    return {
        "topics": [
            {"id": "statistics", "name": "Статистика"},
            {"id": "ab_testing", "name": "A/B тестирование"},
            {"id": "probability", "name": "Теория вероятностей"},
            {"id": "python", "name": "Python"},
            {"id": "sql", "name": "SQL"},
            {"id": "random", "name": "Рандом (микс тем)"},
        ]
    }
