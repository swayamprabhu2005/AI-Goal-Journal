import os
import json
import re
import logging
from typing import Optional, Any
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)

def _clean_json_response(raw_text: str) -> str:
    """Strip markdown backticks or extra text wrapping JSON."""
    text = raw_text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text

class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        if self._client is None:
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
            if not api_key:
                logger.warning("GEMINI_API_KEY is not configured in settings.")
            self._client = genai.Client(api_key=api_key)
        return self._client

    def analyze_journal(
        self, content: str, existing_goals: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Analyzes a daily journal entry using Gemini Flash-Lite and extracts structured
        mood, activities (completed vs ongoing vs planned), blockers, and goal linkages.
        """
        goals_context = ""
        if existing_goals:
            goals_list_str = "\n".join(
                [f"- ID: {g.get('id')} | Title: {g.get('title')} | Status: {g.get('status')}" for g in existing_goals]
            )
            goals_context = f"\nUser's Current Active Goals:\n{goals_list_str}\n"

        prompt = f"""You are an expert AI Goal Journal & Accountability Coach analyzing a user's daily journal entry.
Extract structured insights following these strict rules:

1. MOOD: Assess overall emotional state ('positive', 'neutral', 'reflective', 'overwhelmed', 'motivated') with confidence 0.0 to 1.0.
2. ACTIVITIES: Extract all specific actions or tasks mentioned.
   CRITICAL DISTINCTION:
   - 'completed': Tasks the user finished/completed ("I finished chapter 3", "Submitted the PR").
   - 'ongoing': Tasks currently being worked on ("Working on the presentation", "Halfway done").
   - 'planned': Future intentions or goals for upcoming days ("I plan to study tomorrow", "Will fix the bug next week").
   Do NOT mark future intentions as completed!
   If an activity relates to one of the user's existing goals, note the goal title or ID in 'related_goal_hint'.
3. GOALS: Identify any new goals the user set, or references to existing goals.
4. BLOCKERS: Identify specific obstacles, frustrations, or distractions.
   Categorize each blocker as: 'time', 'distraction', 'technical', 'motivation', 'unclear_task', 'external', or 'other'.
5. INSIGHTS: Provide 1-2 brief, encouraging, coaching observations.
6. QUICK_SUMMARY: Provide a 1-sentence summary.

{goals_context}
User Journal Entry:
\"\"\"{content}\"\"\"

Return ONLY a valid JSON object strictly matching this schema:
{{
  "mood": "positive | neutral | reflective | overwhelmed | motivated",
  "mood_confidence": 0.85,
  "activities": [
    {{
      "text": "Specific activity description",
      "status": "completed | ongoing | planned",
      "related_goal_hint": "Goal title or ID if matched, else null"
    }}
  ],
  "goals": [
    {{
      "text": "Goal description",
      "is_new": true,
      "matched_existing_goal_id": null
    }}
  ],
  "blockers": [
    {{
      "text": "Specific blocker description",
      "category": "time | distraction | technical | motivation | unclear_task | external | other"
    }}
  ],
  "insights": [
    "Coaching insight 1"
  ],
  "quick_summary": "One sentence summary"
}}
"""

        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            cleaned = _clean_json_response(response.text)
            parsed = json.loads(cleaned)
            return parsed
        except Exception as e:
            logger.error("Gemini analysis error: %s", e)
            # Fallback structured response so user data is never lost
            return {
                "mood": "neutral",
                "mood_confidence": 0.5,
                "activities": [
                    {
                        "text": content[:100] + ("..." if len(content) > 100 else ""),
                        "status": "ongoing",
                        "related_goal_hint": None,
                    }
                ],
                "goals": [],
                "blockers": [],
                "insights": ["Journal entry recorded. AI extraction service is temporarily unavailable."],
                "quick_summary": content[:120],
                "error_note": str(e),
            }

    def generate_weekly_summary(
        self,
        user_name: str,
        recent_journals: list[dict[str, Any]],
        goals: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Synthesizes a user's recent journal entries, completed tasks, and blockers
        into an actionable weekly accountability coaching report.
        """
        journal_summaries = []
        for j in recent_journals[:10]:
            content_preview = j.get("content", "")[:200]
            analysis = j.get("ai_analysis") or {}
            mood = analysis.get("mood", "neutral")
            acts = [f"{a.get('text')} ({a.get('status')})" for a in analysis.get("activities", [])]
            blks = [b.get("text") for b in analysis.get("blockers", [])]
            journal_summaries.append(
                f"- Date: {j.get('created_at')} | Mood: {mood}\n  Activities: {', '.join(acts) or 'None'}\n  Blockers: {', '.join(blks) or 'None'}\n  Text: {content_preview}"
            )

        journals_str = "\n".join(journal_summaries) if journal_summaries else "No journal entries logged this week."
        goals_str = "\n".join([f"- {g.get('title')} [{g.get('status')}]" for g in goals]) if goals else "No active goals logged."

        prompt = f"""You are an empathetic, disciplined AI Accountability Coach reviewing the past week for {user_name or 'the user'}.

Review their week's journals and goals:
Goals:
{goals_str}

Recent Journal Data:
{journals_str}

Synthesize an executive weekly accountability summary with actionable feedback:
1. HEADLINE: A 1-sentence punchy evaluation of their week's momentum.
2. WINS: 2-4 concrete achievements, completed tasks, or positive consistency markers.
3. RECURRING_BLOCKERS: 1-3 patterns in obstacles (e.g. fatigue, distractions, unclear tasks).
4. GOAL_STATUS_CHANGES: Key progress made against active goals.
5. MOOD_TREND: 'improving', 'stable', or 'declining'.
6. COACHING_SUGGESTION: 2-3 sentences of personalized, direct, motivating advice for next week.

Return ONLY a valid JSON object matching this schema:
{{
  "headline": "Empowering weekly summary headline",
  "wins": ["Win 1", "Win 2"],
  "recurring_blockers": ["Blocker 1", "Blocker 2"],
  "goal_status_changes": [
    {{
      "goal_id": "optional_id",
      "goal_title": "Title of goal",
      "change": "Summary of progress"
    }}
  ],
  "mood_trend": "improving | stable | declining",
  "coaching_suggestion": "Practical coaching recommendation for next week"
}}
"""

        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            cleaned = _clean_json_response(response.text)
            parsed = json.loads(cleaned)
            return parsed
        except Exception as e:
            logger.error("Gemini weekly summary error: %s", e)
            return {
                "headline": "Weekly Progress Review",
                "wins": ["Consistently recorded thoughts in the goal journal."],
                "recurring_blockers": [],
                "goal_status_changes": [],
                "mood_trend": "stable",
                "coaching_suggestion": "Keep reflecting daily. Small daily steps compound into major breakthroughs.",
                "error_note": str(e),
            }

gemini_service = GeminiService()
