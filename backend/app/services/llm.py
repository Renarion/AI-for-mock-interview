"""LLM service: один вызов в конце интервью; OpenAI API; настройки из llm_config.yaml."""
import json
from typing import Any

from openai import AsyncOpenAI

from app.llm_config_loader import (
    get_full_interview_system_prompt,
    get_full_interview_temperature,
    get_max_tokens_openai_full_interview,
    get_openai_model,
    resolve_openai_api_key,
)
from app.schemas.interview import TaskFeedback


def build_full_interview_user_message(items: list[dict[str, Any]], selection: dict) -> str:
    """
    Явно вшивает в user-сообщение каждый вопрос, ответ кандидата и эталон (как в промпте-схеме).
    Порядок = порядок задач в сессии.
    """
    n = len(items)
    lines: list[str] = [
        "Ниже все данные мок-интервью. Вопросы, ответы кандидата и эталоны заданы по номерам.",
        "",
        "Параметры выбора перед интервью:",
        f"- Специализация: {selection.get('specialization', 'не указано')}",
        f"- Уровень: {selection.get('experience_level', 'не указано')}",
        f"- Tier компании: {selection.get('company_tier', 'не указано')}",
        f"- Тема: {selection.get('topic', 'не указано')}",
        "",
        f"Всего задач: {n}. Верни JSON с ровно {n} элементами в task_feedbacks (см. системный промпт).",
        "",
        "---",
        "",
    ]
    for i, it in enumerate(items, start=1):
        q = str(it.get("task_question", "")).strip()
        ua = str(it.get("user_answer", "")).strip()
        ref_raw = it.get("task_answer")
        ref = str(ref_raw).strip() if ref_raw else ""
        ref_block = ref if ref else "— в базе не задан —"
        subtype = str(it.get("subtype", "general"))

        lines.extend(
            [
                f'Вопрос {i}: "{q}"',
                "",
                f"Ответ пользователя {i}:",
                ua if ua else "— пустой ответ —",
                "",
                f"Правильный ответ {i} (эталон из базы, для сверки):",
                ref_block,
                "",
                f"(Тип задачи {i}: {subtype})",
                "",
                "---",
                "",
            ]
        )
    lines.append(
        "Сформируй разбор: для каждого i сначала мысленно сверь ответ с эталоном, "
        "затем заполни JSON-поля для задачи i. Общий итог — в overall_*."
    )
    return "\n".join(lines)


class LLMService:
    """Генерация полного фидбека по всем ответам одним запросом к OpenAI."""

    def __init__(self) -> None:
        key = resolve_openai_api_key()
        self.openai_client = AsyncOpenAI(api_key=key) if key else None

    def _missing_key_message(self) -> str:
        return (
            "Не задан API-ключ OpenAI. Укажите OPENAI_API_KEY в backend/.env "
            "или secrets.openai_api_key в app/llm_config.yaml (только для локальной разработки)."
        )

    async def generate_full_interview_bundle(
        self,
        items: list[dict[str, Any]],
        selection: dict,
    ) -> tuple[list[TaskFeedback], dict[str, Any]]:
        """
        items: каждый элемент — task_id, task_question, task_answer (опц.), user_answer, subtype.
        Возвращает (список TaskFeedback, поля итогового отчёта для JSON ответа).
        """
        system_prompt = get_full_interview_system_prompt()
        temperature = get_full_interview_temperature()
        user_prompt = build_full_interview_user_message(items, selection)

        if not self.openai_client:
            return self._fallback_bundle(items, self._missing_key_message())
        try:
            response = await self.openai_client.chat.completions.create(
                model=get_openai_model(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
                max_tokens=get_max_tokens_openai_full_interview(),
            )
            raw = response.choices[0].message.content
            result = json.loads(raw or "{}")
        except Exception as e:
            return self._fallback_bundle(items, str(e))

        return self._normalize_bundle(items, result)

    def _normalize_bundle(
        self,
        items: list[dict[str, Any]],
        result: dict,
    ) -> tuple[list[TaskFeedback], dict[str, Any]]:
        raw_list = result.get("task_feedbacks") or []
        feedbacks: list[TaskFeedback] = []
        for i, it in enumerate(items):
            block = raw_list[i] if i < len(raw_list) and isinstance(raw_list[i], dict) else {}
            feedbacks.append(
                TaskFeedback(
                    task_id=int(it["task_id"]),
                    task_question=str(it.get("task_question", "")),
                    user_answer=str(it.get("user_answer", "")),
                    score=int(block.get("score", 0)),
                    strengths=list(block.get("strengths") or []),
                    improvements=list(block.get("improvements") or []),
                    detailed_feedback=str(
                        block.get("detailed_feedback")
                        or "Нет детального комментария в ответе модели."
                    ),
                )
            )
        report = {
            "overall_score": int(result.get("overall_score", 0)),
            "overall_strengths": list(result.get("overall_strengths") or []),
            "areas_to_improve": list(result.get("areas_to_improve") or []),
            "study_recommendations": list(result.get("study_recommendations") or []),
            "motivational_message": str(result.get("motivational_message") or ""),
        }
        if not report["overall_strengths"]:
            report["overall_strengths"] = ["Вы завершили интервью — это уже шаг вперёд."]
        if not report["areas_to_improve"]:
            report["areas_to_improve"] = ["Продолжайте практиковаться на новых задачах."]
        if not report["study_recommendations"]:
            report["study_recommendations"] = ["Повторите темы, где были заминки."]
        if not report["motivational_message"]:
            report["motivational_message"] = "Спасибо за участие. Анализируйте разбор и пробуйте снова."
        return feedbacks, report

    def _fallback_bundle(
        self,
        items: list[dict[str, Any]],
        error_text: str,
    ) -> tuple[list[TaskFeedback], dict[str, Any]]:
        feedbacks = [
            TaskFeedback(
                task_id=int(it["task_id"]),
                task_question=str(it.get("task_question", "")),
                user_answer=str(it.get("user_answer", "")),
                score=0,
                strengths=[],
                improvements=["Не удалось получить оценку от модели"],
                detailed_feedback=f"Ошибка LLM: {error_text}",
            )
            for it in items
        ]
        avg = 0
        report = {
            "overall_score": avg,
            "overall_strengths": ["Вы дошли до конца интервью."],
            "areas_to_improve": ["Проверьте настройку API-ключа и модели в app/llm_config.yaml и backend/.env"],
            "study_recommendations": ["Настройте LLM и пройдите интервью ещё раз."],
            "motivational_message": f"Не удалось сгенерировать отчёт: {error_text}",
        }
        return feedbacks, report
