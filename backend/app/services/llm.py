"""LLM service for generating feedback."""
import json
from typing import Optional
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.config import get_settings
from app.schemas.interview import TaskFeedback, FinalReport

settings = get_settings()


class LLMService:
    """Service for LLM-based feedback generation."""
    
    def __init__(self):
        if settings.llm_provider == "openai":
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
            self.anthropic_client = None
        else:
            self.openai_client = None
            self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    
    async def generate_task_feedback(
        self,
        task_question: str,
        task_answer: Optional[str],  # Reference answer
        user_answer: str,
        task_type: str,
    ) -> TaskFeedback:
        """
        Generate detailed feedback for a single task answer.
        """
        system_prompt = """Ты — эксперт по проведению технических интервью для Data Analyst и Product Analyst позиций в крупных российских технологических компаниях.

Твоя задача — дать развёрнутую и конструктивную оценку ответа кандидата на вопрос интервью.

Формат ответа (JSON):
{
    "score": число от 0 до 100,
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "improvements": ["что можно улучшить 1", "что можно улучшить 2"],
    "detailed_feedback": "Развёрнутый комментарий с анализом ответа, указанием на правильные и неправильные аспекты, рекомендациями по улучшению"
}

Оценивай по следующим критериям:
- Правильность и полнота ответа
- Структурированность изложения
- Практическая применимость
- Знание теории и терминологии"""

        user_prompt = f"""Вопрос интервью (тип: {task_type}):
{task_question}

{"Эталонный ответ для контекста: " + task_answer if task_answer else ""}

Ответ кандидата:
{user_answer}

Дай оценку ответа кандидата в указанном JSON формате."""

        try:
            if settings.llm_provider == "openai":
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                )
                result = json.loads(response.choices[0].message.content)
            else:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=2000,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ]
                )
                # Parse JSON from Claude's response
                content = response.content[0].text
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    raise ValueError("No JSON found in response")
            
            return TaskFeedback(
                task_id=0,  # Will be set by caller
                task_question=task_question,
                user_answer=user_answer,
                score=result.get("score", 50),
                strengths=result.get("strengths", []),
                improvements=result.get("improvements", []),
                detailed_feedback=result.get("detailed_feedback", ""),
            )
            
        except Exception as e:
            # Return a fallback feedback on error
            return TaskFeedback(
                task_id=0,
                task_question=task_question,
                user_answer=user_answer,
                score=0,
                strengths=[],
                improvements=["Произошла ошибка при генерации фидбека"],
                detailed_feedback=f"Ошибка: {str(e)}. Попробуйте ещё раз.",
            )
    
    async def generate_final_report(
        self,
        task_feedbacks: list[TaskFeedback],
        selection: dict,
    ) -> dict:
        """
        Generate final interview report with recommendations.
        """
        system_prompt = """Ты — эксперт по карьерному развитию в сфере Data и Product Analytics.

На основе результатов прохождения мок-интервью тебе нужно:
1. Дать общую оценку кандидата
2. Выделить общие сильные стороны
3. Определить области для улучшения
4. Дать конкретные рекомендации по обучению
5. Написать мотивирующее сообщение

Формат ответа (JSON):
{
    "overall_score": число от 0 до 100,
    "overall_strengths": ["сильная сторона 1", "сильная сторона 2"],
    "areas_to_improve": ["область 1", "область 2"],
    "study_recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"],
    "motivational_message": "Мотивирующее сообщение для кандидата"
}"""

        feedbacks_text = "\n\n".join([
            f"Задача {i+1} (оценка: {fb.score}/100):\n- Сильные стороны: {', '.join(fb.strengths)}\n- Нужно улучшить: {', '.join(fb.improvements)}"
            for i, fb in enumerate(task_feedbacks)
        ])
        
        user_prompt = f"""Профиль интервью:
- Специализация: {selection.get('specialization', 'не указано')}
- Уровень: {selection.get('experience_level', 'не указано')}
- Tier компании: {selection.get('company_tier', 'не указано')}
- Тема: {selection.get('topic', 'не указано')}

Результаты по задачам:
{feedbacks_text}

Сформируй итоговый отчёт в JSON формате."""

        try:
            if settings.llm_provider == "openai":
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                )
                result = json.loads(response.choices[0].message.content)
            else:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=2000,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ]
                )
                content = response.content[0].text
                import re
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    raise ValueError("No JSON found in response")
            
            return result
            
        except Exception as e:
            return {
                "overall_score": sum(fb.score for fb in task_feedbacks) // len(task_feedbacks) if task_feedbacks else 0,
                "overall_strengths": ["Вы прошли интервью до конца!"],
                "areas_to_improve": ["Попробуйте пройти ещё раз для лучшего результата"],
                "study_recommendations": ["Продолжайте практиковаться"],
                "motivational_message": f"Произошла ошибка при генерации отчёта: {str(e)}. Но главное — вы практикуетесь, и это уже отлично!",
            }
