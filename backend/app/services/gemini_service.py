import os
import json
import re
import logging
from typing import Optional, Any
from google import genai
from app.core.config import settings
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

ACRONYMS = {"es", "dsa", "daa", "os", "dbms", "pr", "api", "ui", "ux", "ai", "ml", "sql", "cs", "it"}

def _clean_json_response(raw_text: str) -> str:
    """Strip markdown backticks or extra text wrapping JSON."""
    text = raw_text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text

def parse_due_date_from_text(text: str) -> Optional[str]:
    """Parse relative date expressions (tomorrow, tommorow, 1st of oct, next Friday, in 3 days) into YYYY-MM-DD ISO string."""
    if not text:
        return None
    lower = text.lower()
    now = datetime.now(timezone.utc)
    
    if "day after tomorrow" in lower:
        return (now + timedelta(days=2)).strftime("%Y-%m-%d")
    elif "tomorrow" in lower or "tommorow" in lower:
        return (now + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "next week" in lower:
        return (now + timedelta(days=7)).strftime("%Y-%m-%d")
    
    match_days = re.search(r"in\s+(\d+)\s+days?", lower)
    if match_days:
        num_days = int(match_days.group(1))
        return (now + timedelta(days=num_days)).strftime("%Y-%m-%d")
        
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for idx, day in enumerate(weekdays):
        if day in lower:
            current_weekday = now.weekday()
            days_ahead = idx - current_weekday
            if days_ahead <= 0:
                days_ahead += 7
            return (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    month_names = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
        "aug": 8, "august": 8, "sep": 9, "september": 9, "sept": 9,
        "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
    }

    match_date = re.search(r"(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)", lower) or re.search(r"([a-z]+)\s+(\d+)(?:st|nd|rd|th)?", lower)
    if match_date:
        g1, g2 = match_date.group(1), match_date.group(2)
        day_val, month_val = None, None
        if g1.isdigit() and g2 in month_names:
            day_val = int(g1)
            month_val = month_names[g2]
        elif g2.isdigit() and g1 in month_names:
            day_val = int(g2)
            month_val = month_names[g1]

        if day_val and month_val:
            year_val = now.year
            if month_val < now.month or (month_val == now.month and day_val < now.day):
                year_val += 1
            return f"{year_val}-{month_val:02d}-{day_val:02d}"

    return None

def preserve_acronyms(title: str) -> str:
    words = title.split()
    res = []
    for w in words:
        clean_w = re.sub(r"\W+", "", w.lower())
        if clean_w in ACRONYMS:
            res.append(w.upper())
        else:
            res.append(w)
    return " ".join(res)

def clean_title(text_snippet: str) -> str:
    """Clean sentence/snippet into a concise 3-7 word title."""
    if not text_snippet:
        return "New Goal"
    s = text_snippet.strip()

    # Check for specific course assignment pattern (e.g. 'new ES assignment' -> 'Submit ES Assignment')
    match_assign = re.search(r"(?:new\s+)?([a-zA-Z0-9_-]+\s+assignment)", s, re.IGNORECASE)
    if match_assign:
        course = match_assign.group(1).title()
        course = preserve_acronyms(course)
        if "submit" in s.lower() or "have to" in s.lower() or "need to" in s.lower():
            return f"Submit {course}"
        return course

    # Strip trailing date or submission suffixes
    date_patterns = [
        r"\s+which\s+i\s+have\s+to\s+submit.*",
        r"\s+which\s+i\s+need\s+to\s+submit.*",
        r"\s+by\s+next\s+month\s+on\s+\d+(?:st|nd|rd|th)?\s+of\s+[a-z]+",
        r"\s+by\s+next\s+month",
        r"\s+by\s+\d+(?:st|nd|rd|th)?\s+of\s+[a-z]+",
        r"\s+by\s+1st\s+of\s+oct",
        r"\s+by\s+october\s+\d+",
        r"\s+by\s+[a-z]+\s+\d+",
        r"\s+by\s+tomorrow",
        r"\s+by\s+tommorow",
    ]
    for pattern in date_patterns:
        s = re.sub(pattern, "", s, flags=re.IGNORECASE).strip()

    prefixes = [
        "my faculty or teacher gave me new",
        "my faculty or teacher gave me",
        "my faculty gave me new",
        "my faculty gave me",
        "my teacher gave me new",
        "my teacher gave me",
        "my professor gave me new",
        "my professor gave me",
        "teacher gave me new",
        "teacher gave me",
        "faculty gave me new",
        "faculty gave me",
        "professor gave me new",
        "professor gave me",
        "gave me new",
        "gave me",
        "assigned me new",
        "assigned me",
        "also i have to do",
        "also i have to complete",
        "also i have to",
        "also i need to do",
        "also i need to",
        "also i want to",
        "also i will",
        "also i must",
        "also i should",
        "also i have",
        "also",
        "and i have to",
        "and i need to",
        "and i will",
        "and",
        "so i have to",
        "so i will",
        "so",
        "tomorrow i will complete",
        "tomorrow i will",
        "i have to complete",
        "i need to complete",
        "i have to do",
        "i need to do",
        "i want to do",
        "i have to",
        "i need to",
        "i must",
        "i should",
        "i will",
        "i want to",
        "my goal is to",
        "my goal is",
        "plan to",
        "aim to",
        "trying to",
        "going to",
    ]
    lower = s.lower()
    for p in prefixes:
        if lower.startswith(p):
            s = s[len(p):].strip()
            break

    words = s.split()
    if len(words) > 7:
        s = " ".join(words[:7])

    cleaned = s.strip()
    if not cleaned:
        return "New Goal"
    res = cleaned[0].upper() + cleaned[1:]
    return preserve_acronyms(res)

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
Today's Date: {today_str}

ATTENTION MECHANISM & FOCUS RULES:
- RULE 1 (BACKSTAGING vs ACTIVE TODAY): Separate historical commitments or background context ("backstaging") from concrete actions executed today. Pay primary attention to what the user actively worked on today.
- RULE 2 (STRICT STATUS CLASSIFICATION):
   - 'completed': Tasks finished today ("finished chapter 3", "submitted PR").
   - 'ongoing': Tasks currently in progress ("working on presentation").
   - 'planned': Intentions for the future ("will study tomorrow").
   Do NOT mark planned tasks as completed!
- RULE 3 (AUTOMATIC GOAL DETECTION & DEDUPLICATION):
   Identify explicit or strong implicit commitments to new medium/long-term objectives, including teacher/faculty assignments ("I want to learn Docker", "Aiming to run 5k", "Planning to launch portfolio", "Faculty gave me new ES assignment to submit by tomorrow").
   When user mentions faculty/teacher assignments, clean title (e.g. "Submit ES Assignment"), set category to 'Learning', and extract exact target date.
   If the intention already corresponds to an existing goal from the context below, set "is_new": false and provide "matched_existing_goal_id".
   Assign a confidence score (0.0 to 1.0) and suggest a category ('Career', 'Learning', 'Health', 'Finance', 'Personal', or 'Other').
   If target date is mentioned (e.g., "by tomorrow" or "by next month"), calculate the exact target date relative to Today's Date ({today_str}). Ensure the year is 2026 or future.
- RULE 4 (QUANTITATIVE & ACCURATE PROGRESS):
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
      "title": "Concise, actionable goal title (3-7 words)",
      "description": "Context and rationale extracted from journal",
      "category": "Career | Learning | Health | Finance | Personal | Other",
      "is_new": true,
      "confidence": 0.90,
      "target_date": "YYYY-MM-DD or null",
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
            return self._normalize_analysis_result(parsed, content)
        except Exception as e:
            logger.error("Gemini analysis error: %s", e)
            return self._rule_based_fallback(content, str(e))

    def _normalize_analysis_result(self, parsed: dict[str, Any], content: str) -> dict[str, Any]:
        """Normalize JSON response so that goals, goalsExtracted, completedTasks are always present."""
        goals_raw = parsed.get("goals", [])
        activities_raw = parsed.get("activities", [])

        # Clean goal titles & calculate confidence integer
        for g in goals_raw:
            if "title" in g:
                g["title"] = clean_title(g["title"])
            conf = g.get("confidence", 0.90)
            if isinstance(conf, float) and conf <= 1.0:
                g["confidence_pct"] = int(conf * 100)
            else:
                g["confidence_pct"] = int(conf) if str(conf).isdigit() else 90

        completed_tasks = [
            a.get("text") for a in activities_raw if a.get("status") == "completed"
        ]

        goals_extracted = [
            {
                "title": clean_title(g.get("title", "")),
                "confidence": g.get("confidence_pct", 90),
                "description": g.get("description") or f"Extracted task: {content[:70]}...",
                "due_date": g.get("target_date"),
                "category": g.get("category", "Learning"),
            }
            for g in goals_raw
        ]

        parsed["goals"] = goals_raw
        parsed["goalsExtracted"] = goals_extracted
        parsed["completedTasks"] = completed_tasks
        return parsed

    def _rule_based_fallback(self, content: str, error_note: str = "") -> dict[str, Any]:
        """
        Smart rule-based extraction fallback for local dev when GEMINI_API_KEY is missing or invalid.
        Parses sentences, cleans titles (3-7 words), extracts target due dates, activities, and blockers.
        """
        text_lower = content.lower()
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", content) if s.strip()]

        goal_phrases = [
            "i have to", "i need to", "i must", "i should",
            "tomorrow i will", "i will", "my goal is", "i want to", "plan to",
            "will build", "will create", "complete this by", "finish by", "want to",
            "faculty", "teacher", "professor", "assignment", "homework", "lab", "dsa", "es"
        ]

        complete_phrases = [
            "completed", "complete", "finished", "done", "submitted",
            "uploaded", "sent", "resolved", "fixed", "built", "implemented"
        ]

        blocker_phrases = [
            "could not", "couldn't", "unable to", "not able to",
            "failed to", "missed my", "still pending", "pending",
            "not completed", "blocked", "stuck", "distracted"
        ]

        candidate_goals = []
        activities = []
        blockers = []
        progress_updates = []

        for sentence in sentences:
            sent_lower = sentence.lower()

            # Percentage / Progress Update check
            pct_match = re.search(r"(\d+)\s*%", sentence) or re.search(r"(\d+)\s*percent", sentence)
            is_progress_report = bool(pct_match) or any(k in sent_lower for k in ["% completed", "% done", "percent completed", "progressed", "worked on"])

            if pct_match:
                pct_val = int(pct_match.group(1))
                hint_word = "dsa" if "dsa" in sent_lower else ("backend" if "api" in sent_lower else None)
                progress_updates.append({
                    "related_goal_hint": hint_word,
                    "progress_increment": pct_val,
                    "quantified_completed": pct_val,
                    "quantified_total": 100,
                    "effort_level": "completion" if pct_val >= 100 else "moderate",
                    "evidence_quote": sentence,
                    "note": sentence,
                })

            # Goal check (only if sentence is NOT purely a progress percentage report on an existing goal)
            if not is_progress_report and any(p in sent_lower for p in goal_phrases):
                goal_title = clean_title(sentence)
                due_date_str = parse_due_date_from_text(sentence) or parse_due_date_from_text(content)
                learning_keywords = ["faculty", "teacher", "professor", "assignment", "homework", "dsa", "es", "study", "learn", "read", "course", "exam", "test", "lab"]
                cat = "Learning" if any(k in sent_lower for k in learning_keywords) else "Personal"

                if not any(g.get("title") == goal_title for g in candidate_goals):
                    candidate_goals.append({
                        "title": goal_title,
                        "text": goal_title,
                        "confidence": 0.90,
                        "confidence_pct": 90,
                        "description": sentence,
                        "category": cat,
                        "target_date": due_date_str,
                        "is_new": True,
                    })

            # Completed tasks check
            if pct_match or any(p in sent_lower for p in complete_phrases):
                activities.append({
                    "text": sentence.strip(),
                    "status": "completed",
                    "related_goal_hint": "dsa" if "dsa" in sent_lower else None,
                })

            # Blocker check
            if any(p in sent_lower for p in blocker_phrases):
                blockers.append({
                    "text": sentence,
                    "category": "distraction" if "distract" in sent_lower else "technical",
                    "severity": "medium",
                })

        # Default fallback activity if none recorded
        if not activities:
            activities.append({
                "text": content[:90] + ("..." if len(content) > 90 else ""),
                "status": "ongoing",
                "related_goal_hint": None,
            })

        # Default fallback goal if none found yet and NOT a progress report
        if not candidate_goals and not progress_updates and content.strip():
            goal_title = clean_title(content)
            due_date_str = parse_due_date_from_text(content)
            learning_keywords = ["faculty", "teacher", "professor", "assignment", "homework", "dsa", "es", "study", "learn", "read", "course", "exam", "test", "lab"]
            cat = "Learning" if any(k in text_lower for k in learning_keywords) else "Personal"
            candidate_goals.append({
                "title": goal_title,
                "text": goal_title,
                "confidence": 0.85,
                "confidence_pct": 85,
                "description": content,
                "category": cat,
                "target_date": due_date_str,
                "is_new": True,
            })

        completed_tasks = [a["text"] for a in activities if a.get("status") == "completed"]
        if not completed_tasks:
            completed_tasks = [clean_title(content)] if any(p in text_lower for p in ["finished", "completed", "done", "submitted", "uploaded", "resolved", "built"]) else []

        goals_extracted = [
            {
                "title": g["title"],
                "confidence": g.get("confidence_pct", 90),
                "description": g.get("description", content),
                "due_date": g.get("target_date"),
            }
            for g in candidate_goals
        ]

        return {
            "status": "success",
            "title": clean_title(content),
            "summary": f"MindFlow analyzed your entry. Extracted {len(candidate_goals)} goal(s) and {len(completed_tasks)} completed task(s).",
            "quick_summary": content[:130],
            "mood": "positive" if "productive" in text_lower or "excellent" in text_lower or "completed" in text_lower else "neutral",
            "mood_confidence": 0.88,
            "activities": activities,
            "completedTasks": completed_tasks,
            "goals": candidate_goals,
            "goalsExtracted": goals_extracted,
            "blockers": blockers,
            "progress_updates": progress_updates,
            "insights": ["Reflection processed. AI extracted activities, blockers, and goal hints."],
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
