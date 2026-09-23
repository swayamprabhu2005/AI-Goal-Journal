import logging
import os
from typing import Optional, Any
from groq import Groq

from app.core.config import settings
from app.services.goal_service import goal_service
from app.services.habit_service import habit_service
from app.services.journal_service import journal_service

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self._client: Optional[Groq] = None

    def _get_client(self) -> Optional[Groq]:
        if self._client is None:
            api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
            if api_key:
                try:
                    self._client = Groq(api_key=api_key)
                except Exception as e:
                    logger.warning("Failed to initialize Groq client: %s", e)
        return self._client

    def _build_user_context(self, user_id: str) -> str:
        context_parts = []

        # 1. Goals Context
        try:
            goals = goal_service.list_goals(user_id=user_id)
            if goals:
                goal_lines = []
                for g in goals:
                    note = f" (Note: {g.latest_progress_note})" if g.latest_progress_note else ""
                    goal_lines.append(f"- [{g.status}] '{g.title}' — {g.progress_value}% complete, Category: {g.category or 'General'}{note}")
                context_parts.append("### Current Goals:\n" + "\n".join(goal_lines))
            else:
                context_parts.append("### Current Goals: None set yet.")
        except Exception as e:
            logger.debug("Error fetching goals context: %s", e)

        # 2. Habits Context
        try:
            habits = habit_service.list_habits(user_id=user_id)
            if habits:
                habit_lines = []
                for h in habits[:6]:
                    stats = habit_service.get_habit_stats(user_id=user_id, habit_id=h.id)
                    streak = stats.get("current_streak", 0) if stats else 0
                    comp = stats.get("completion_rate_30d", 0) if stats else 0
                    habit_lines.append(f"- '{h.title}' (Freq: {h.frequency}, Streak: {streak} days, 30d consistency: {comp}%)")
                context_parts.append("### Habits & Consistency:\n" + "\n".join(habit_lines))
        except Exception as e:
            logger.debug("Error fetching habits context: %s", e)

        # 3. Recent Journals & Detected Emotional States
        try:
            journals = journal_service.list_journals(user_id=user_id)
            if journals:
                journal_lines = []
                for j in journals[:5]:
                    mood = j.detected_mood or "unspecified"
                    conf = f" ({round(j.mood_confidence * 100)}% confidence)" if j.mood_confidence else ""
                    kw = f" [Keywords: {', '.join(j.trigger_keywords)}]" if j.trigger_keywords else ""
                    date_str = j.created_at.strftime("%Y-%m-%d") if j.created_at else "Recent"
                    
                    blockers_str = ""
                    if j.ai_analysis and isinstance(j.ai_analysis, dict):
                        blks = j.ai_analysis.get("blockers", [])
                        if blks:
                            blockers_str = f" | Blockers: {', '.join(str(b.get('text', b)) if isinstance(b, dict) else str(b) for b in blks[:2])}"
                    
                    journal_lines.append(f"- [{date_str}] Mood: {mood}{conf}{kw}{blockers_str}")
                context_parts.append("### Recent Reflections & Mood Rhythm (from Neural Mood Analyzer):\n" + "\n".join(journal_lines))
        except Exception as e:
            logger.debug("Error fetching journal context: %s", e)

        return "\n\n".join(context_parts)

    def chat(
        self,
        user_id: str,
        message: str,
        conversation_history: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        """
        Conduct a 2-way conversation with Groq Cloud Llama-3.3-70B model,
        grounded in the user's real goals, habits, blockers, and detected moods.
        """
        client = self._get_client()
        if not client:
            return {
                "reply": "I'm your personal AI Coach! To enable full conversational coaching, please ensure `GROQ_API_KEY` is configured in your backend `.env` file.",
                "model": "offline-fallback",
            }

        user_context = self._build_user_context(user_id=user_id)

        system_prompt = f"""You are the personal AI Coach in the AI Goal Journal app.
You have a warm, calm, empathetic, and grounded voice. You are direct, practical, and highly encouraging without being cheesy or robotic.

Below is the user's current live state from their personal journal system:
{user_context}

Guidelines:
1. Ground your advice in their real goals, habits, and recent reflections.
2. Emotional Intelligence: Pay close attention to their recent moods (e.g. burnout, anxiety, focus, celebration, procrastination). If they are struggling or overwhelmed, validate their feeling and recommend tiny, 2-minute actionable steps to lower friction. If they have momentum (focus, motivated), challenge them to maintain consistency.
3. Keep responses structured, concise, and easy to read (max 3-4 concise paragraphs or bullet points). If presenting schedules or structured comparisons, use clean markdown tables.
4. Closing question: End by asking one thoughtful question or reflection naturally in conversational prose.
5. STRICT FORMATTING RULES:
   - NEVER label questions with artificial prefixes like "**Reflection prompt:**", "**Reflection question:**", "**Reflection:**", or "Prompt:". Just ask the question naturally as part of your conversation.
   - NEVER use decorative divider lines like "---" or "___".
   - NEVER mention "Groq", "Llama", or AI model architectures to the user.
"""

        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            for turn in conversation_history[-8:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        primary_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        candidate_models = [primary_model]
        for fallback in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for model in candidate_models:
            try:
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,
                )
                reply_text = completion.choices[0].message.content or ""
                return {
                    "reply": reply_text.strip(),
                    "model": model,
                    "usage": {
                        "prompt_tokens": getattr(completion.usage, "prompt_tokens", None),
                        "completion_tokens": getattr(completion.usage, "completion_tokens", None),
                    },
                }
            except Exception as e:
                last_error = e
                logger.warning("Groq model %s attempt failed: %s", model, e)
                continue

        logger.error("All Groq models failed: %s", last_error)
        return {
            "reply": f"I ran into an issue connecting to the coaching service ({str(last_error)[:120]}). Remember that taking one small step toward your goals today still counts!",
            "model": primary_model,
            "error": str(last_error),
        }

groq_service = GroqService()
