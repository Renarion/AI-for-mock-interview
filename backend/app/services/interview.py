"""Interview orchestration service."""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.task import Task
from app.models.llm_answer import LLMAnswer
from app.models.user import User
from app.schemas.task import TaskSelection, TaskResponse
from app.schemas.interview import TaskFeedback, InterviewSession
from app.services.llm import LLMService


# In-memory session storage (use Redis in production)
_sessions: dict[str, dict] = {}


class InterviewService:
    """Service for managing interview flow."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm_service = LLMService()
    
    async def start_interview(
        self,
        user: User,
        selection: TaskSelection,
    ) -> tuple[str, List[TaskResponse]]:
        """
        Start a new interview session.
        Returns session_id and list of tasks.
        Each submitted answer consumes 1 question; new users have 1 free.
        """
        questions_left = (1 if user.trial_question_flg else 0) + user.paid_questions_number_left
        if questions_left <= 0:
            raise ValueError("Нет доступных вопросов. Приобретите пакет вопросов.")
        
        # Get tasks based on selection
        tasks = await self._select_tasks(selection)
        if len(tasks) < 1:
            raise ValueError("Недостаточно задач для выбранных параметров.")
        
        # Limit tasks to user's question balance (max 3 per session)
        max_tasks = min(3, questions_left, len(tasks))
        tasks = tasks[:max_tasks]
        
        # Create session
        session_id = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "user_id": user.user_id,
            "selection": selection.model_dump(),
            "tasks": [
                {
                    "task_id": t.task_id,
                    "task_question": t.task_question,
                    "task_answer": t.task_answer,
                    "subtype": t.subtype,
                }
                for t in tasks
            ],
            "current_task_index": 0,
            "answers": [],
            "feedbacks": [],
            "started_at": datetime.utcnow().isoformat(),
            "status": "active",
        }
        
        _sessions[session_id] = session
        
        # Create task responses
        total = len(tasks)
        task_responses = [
            TaskResponse(
                task_id=t.task_id,
                task_question=t.task_question,
                task_number=i + 1,
                total_tasks=total,
                time_limit_minutes=20,
            )
            for i, t in enumerate(tasks)
        ]
        
        return session_id, task_responses
    
    async def _select_tasks(self, selection: TaskSelection) -> List[Task]:
        """Select tasks based on user preferences."""
        query = select(Task).where(
            Task.company_tier == selection.company_tier,
            Task.employee_level == selection.experience_level,
            Task.type == selection.specialization,
        )
        
        if selection.topic != "random":
            query = query.where(Task.subtype == selection.topic)
        
        # Randomize and limit to 3
        query = query.order_by(func.random()).limit(3)
        
        result = await self.db.execute(query)
        tasks = result.scalars().all()
        
        # If random topic, ensure variety
        if selection.topic == "random" and len(tasks) < 3:
            # Fallback: get any tasks matching tier and level
            fallback_query = select(Task).where(
                Task.company_tier == selection.company_tier,
                Task.employee_level == selection.experience_level,
            ).order_by(func.random()).limit(3)
            
            result = await self.db.execute(fallback_query)
            tasks = result.scalars().all()
        
        return list(tasks)
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session by ID."""
        return _sessions.get(session_id)
    
    def get_current_task(self, session_id: str) -> Optional[dict]:
        """Get current task for session."""
        session = _sessions.get(session_id)
        if not session or session["status"] != "active":
            return None
        
        idx = session["current_task_index"]
        if idx >= len(session["tasks"]):
            return None
        
        task = session["tasks"][idx]
        total = len(session["tasks"])
        return {
            "task_id": task["task_id"],
            "task_question": task["task_question"],
            "task_number": idx + 1,
            "total_tasks": total,
            "time_limit_minutes": 20,
        }
    
    async def submit_answer(
        self,
        session_id: str,
        task_id: int,
        answer: str,
        user: User,
    ) -> TaskFeedback:
        """Submit answer and get feedback."""
        session = _sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        if session["status"] != "active":
            raise ValueError("Session is not active")
        
        idx = session["current_task_index"]
        current_task = session["tasks"][idx]
        
        if current_task["task_id"] != task_id:
            raise ValueError("Task ID mismatch")
        
        # Generate feedback using LLM
        feedback = await self.llm_service.generate_task_feedback(
            task_question=current_task["task_question"],
            task_answer=current_task.get("task_answer"),
            user_answer=answer,
            task_type=current_task.get("subtype", "general"),
        )
        feedback.task_id = task_id
        
        # Store answer and feedback
        session["answers"].append({
            "task_id": task_id,
            "answer": answer,
            "submitted_at": datetime.utcnow().isoformat(),
        })
        session["feedbacks"].append(feedback.model_dump())
        
        # Move to next task
        session["current_task_index"] += 1
        
        # Save feedback to database
        await self._save_feedback(user, task_id, answer, feedback)
        
        return feedback
    
    async def _save_feedback(
        self,
        user: User,
        task_id: int,
        user_answer: str,
        feedback: TaskFeedback,
    ):
        """Save feedback to database for quality tracking."""
        llm_answer = LLMAnswer(
            user_id=user.user_id,
            feedback_id=str(uuid.uuid4()),
            feedback_json=feedback.model_dump(),
            provided_feedback=feedback.detailed_feedback,
            task_id=task_id,
            user_answer=user_answer,
        )
        self.db.add(llm_answer)
        await self.db.flush()
    
    async def finish_interview(
        self,
        session_id: str,
        user: User,
    ) -> dict:
        """Finish interview and generate final report."""
        session = _sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session["status"] = "completed"
        
        # Convert stored feedbacks back to TaskFeedback objects
        task_feedbacks = [
            TaskFeedback(**fb) for fb in session["feedbacks"]
        ]
        
        # Generate final report (questions already consumed per submit_answer)
        report = await self.llm_service.generate_final_report(
            task_feedbacks=task_feedbacks,
            selection=session["selection"],
        )
        
        return {
            "session_id": session_id,
            "overall_score": report.get("overall_score", 0),
            "task_feedbacks": session["feedbacks"],
            "overall_strengths": report.get("overall_strengths", []),
            "areas_to_improve": report.get("areas_to_improve", []),
            "study_recommendations": report.get("study_recommendations", []),
            "motivational_message": report.get("motivational_message", ""),
            "completed_at": datetime.utcnow().isoformat(),
        }
    
    def can_continue(self, session_id: str) -> tuple[bool, int, int]:
        """Check if user can continue to next task."""
        session = _sessions.get(session_id)
        if not session:
            return False, 0, 0
        
        completed = session["current_task_index"]
        total = len(session["tasks"])
        remaining = total - completed
        return remaining > 0 and session["status"] == "active", completed, remaining
