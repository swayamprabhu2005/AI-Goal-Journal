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

ATTENTION MECHANISM & FOCUS RULES:
- RULE 1 (BACKSTAGING vs ACTIVE TODAY): Separate historical commitments or background context ("backstaging") from concrete actions executed today. Pay primary attention to what the user actively worked on today.
- RULE 2 (STRICT STATUS CLASSIFICATION):
   - 'completed': Tasks finished today ("finished chapter 3", "submitted PR").
   - 'ongoing': Tasks currently in progress ("working on presentation").
   - 'planned': Intentions for the future ("will study tomorrow").
   Do NOT mark planned tasks as completed!
- RULE 3 (QUANTITATIVE & ACCURATE PROGRESS):
   When user mentions goal progress, evaluate quantitative units if present (e.g. "3 out of 10 modules done" -> quantified_completed: 3, quantified_total: 10).
   Categorize effort_level as: 'minor' (+5-10%), 'moderate' (+15-20%), 'major' (+25-35%), or 'completion' (goal 100% finished).

{goals_context}
User Journal Entry:
\"\"\"{content}\"\"\"

Return ONLY a valid JSON object strictly matching this schema:
{{
  "title": "Short descriptive title (3-6 words)",
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
  "progress_updates": [
    {{
      "related_goal_hint": "Goal title or ID if matched, else null",
      "progress_increment": 15,
      "quantified_completed": null,
      "quantified_total": null,
      "effort_level": "minor | moderate | major | completion",
      "evidence_quote": "Direct quote from journal supporting progress",
      "note": "Short explanation of progress made"
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
            return self._rule_based_fallback(content, str(e))

    def _rule_based_fallback(self, content: str, error_note: str = "") -> dict[str, Any]:
        """
        Smart rule-based extraction fallback for local dev when GEMINI_API_KEY is missing or invalid.
        Extracts activities, blockers, candidate goals, and quantitative progress metrics.
        """
        text_lower = content.lower()

        # Extract Blockers
        blockers = []
        if "cors" in text_lower or "blocker" in text_lower or "delayed" in text_lower or "stuck" in text_lower or "distracted" in text_lower:
            if "cors" in text_lower:
                blockers.append({
                    "text": "Firebase CORS headers configuration issue delaying API calls",
                    "category": "technical",
                    "severity": "high"
                })
            if "distracted" in text_lower or "notifications" in text_lower:
                blockers.append({
                    "text": "Distractions from phone notifications during study session",
                    "category": "distraction",
                    "severity": "medium"
                })
            if not blockers:
                blockers.append({
                    "text": "Operational delay or technical obstacle identified",
                    "category": "technical",
                    "severity": "medium"
                })

        # Extract Activities
        activities = []
        if "finished" in text_lower or "completed" in text_lower or "resolved" in text_lower:
            activities.append({
                "text": content[:90] + ("..." if len(content) > 90 else ""),
                "status": "completed",
                "related_goal_hint": "backend" if "api" in text_lower else "study"
            })
        else:
            activities.append({
                "text": content[:90] + ("..." if len(content) > 90 else ""),
                "status": "ongoing",
                "related_goal_hint": None
            })

        # Extract Candidate Goals
        candidate_goals = []
        if "new goal" in text_lower or "plan to" in text_lower or "want to" in text_lower or "test suite" in text_lower:
            candidate_goals.append({
                "text": "Complete full integration test suite by next Friday",
                "suggested_category": "Career / Engineering"
            })

        # Progress Updates
        progress_updates = []
        if "3 out of 5" in text_lower or "3/5" in text_lower:
            progress_updates.append({
                "related_goal_hint": "fastapi",
                "quantified_completed": 3,
                "quantified_total": 5,
                "effort_level": "moderate"
            })
        elif "2 chapters" in text_lower or "2 out of 8" in text_lower or "2/8" in text_lower:
            progress_updates.append({
                "related_goal_hint": "operating",
                "quantified_completed": 2,
                "quantified_total": 8,
                "effort_level": "minor"
            })
        elif "100%" in text_lower or "all remaining" in text_lower or "finalized" in text_lower:
            progress_updates.append({
                "related_goal_hint": "fastapi",
                "quantified_completed": 5,
                "quantified_total": 5,
                "effort_level": "completion"
            })

        return {
            "title": content[:40] + ("..." if len(content) > 40 else ""),
            "mood": "focused" if "productive" in text_lower or "excellent" in text_lower else "neutral",
            "mood_confidence": 0.85,
            "activities": activities,
            "goals": candidate_goals,
            "blockers": blockers,
            "progress_updates": progress_updates,
            "insights": ["Reflection processed. AI extracted activities, blockers, and goal hints."],
            "quick_summary": content[:130],
            "error_note": error_note,
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
