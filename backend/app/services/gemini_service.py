import os
import json
import re
import logging
from typing import Optional, Any
from google import genai
from pydantic import ValidationError
from app.core.config import settings
from datetime import datetime, timezone, timedelta
from google.genai import types
from app.schemas.roadmap import RoadmapResponse, Milestone
from app.schemas.extraction import ExtractionResult
from app.prompts.journal_extraction import SYSTEM_INSTRUCTION as EXTRACTION_SYSTEM_INSTRUCTION, build_extraction_prompt

logger = logging.getLogger(__name__)

class GeminiExtractionError(Exception):
    def __init__(self, message: str, raw_response: str | None = None):
        super().__init__(message)
        self.raw_response = raw_response

REPAIR_PROMPT_TEMPLATE = """\
Your previous response could not be parsed/validated. Fix it and return
ONLY the corrected JSON object — no markdown fences, no commentary.

REQUIRED SCHEMA:
{schema}

YOUR PREVIOUS (INVALID) RESPONSE:
{previous_response}

VALIDATION ERROR:
{error}
"""

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
    """Parse relative date expressions (tomorrow, tommorow, 1st of oct, next Friday, in 3 days, 12th of this month, on 12th) into YYYY-MM-DD ISO string."""
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

    # Match "12th of this month", "12th of current month", "12th this month"
    match_this_month = re.search(r"(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?(?:this|current)\s+month", lower)
    if match_this_month:
        day_val = int(match_this_month.group(1))
        if 1 <= day_val <= 31:
            try:
                target_date = datetime(now.year, now.month, day_val, tzinfo=timezone.utc)
                return target_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

    # Match "12th of next month", "12th next month"
    match_next_month = re.search(r"(\d+)(?:st|nd|rd|th)?\s+(?:of\s+)?next\s+month", lower)
    if match_next_month:
        day_val = int(match_next_month.group(1))
        if 1 <= day_val <= 31:
            next_month = now.month + 1
            year_val = now.year
            if next_month > 12:
                next_month = 1
                year_val += 1
            try:
                target_date = datetime(year_val, next_month, day_val, tzinfo=timezone.utc)
                return target_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

    # Match "on 12th", "on the 12th", "by 12th", "by the 12th", "due 12th", "until 12th", "complete on 12th", "submit on 12th"
    match_ordinal_day = re.search(r"(?:on|by|due|until|before|complete\s+on|submit\s+on)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\b", lower)
    if match_ordinal_day:
        day_val = int(match_ordinal_day.group(1))
        if 1 <= day_val <= 31:
            month_val = now.month
            year_val = now.year
            if day_val < now.day:
                month_val += 1
                if month_val > 12:
                    month_val = 1
                    year_val += 1
            try:
                target_date = datetime(year_val, month_val, day_val, tzinfo=timezone.utc)
                return target_date.strftime("%Y-%m-%d")
            except ValueError:
                pass

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

    # 1. Direct course subject + assignment detection (e.g. 'today maths faculty gave us assighnment' -> 'Submit Maths Assignment')
    course_match = re.search(
        r"\b(maths?|es|dsa|daa|os|dbms|cs|it|physics|chemistry|biology|english|coding|programming|web\s+dev(?:elopment)?)\b.*?\b(assignment|assighnment|assignement|homework|project|lab|task)\b",
        s,
        re.IGNORECASE
    )
    if course_match:
        subj = course_match.group(1).title()
        subj = preserve_acronyms(subj)
        noun = course_match.group(2).lower()
        noun_clean = "Assignment" if "assign" in noun or "homework" in noun else noun.title()
        return f"Submit {subj} {noun_clean}"

    # 2. General '[course] assignment' matching
    match_assign = re.search(r"(?:new\s+)?([a-zA-Z0-9_-]+\s+(?:assignment|assighnment|assignement))", s, re.IGNORECASE)
    if match_assign:
        course = match_assign.group(1).title()
        course = re.sub(r"\b(Us|Me|A|The|New)\s+", "", course, flags=re.IGNORECASE).strip()
        course = preserve_acronyms(course)
        if "submit" in s.lower() or "have to" in s.lower() or "need to" in s.lower() or "gave" in s.lower():
            return f"Submit {course}"
        return course

    # Strip trailing date or submission suffixes
    date_patterns = [
        r"\s+(?:and\s+)?i\s+have\s+to\s+complete.*",
        r"\s+(?:and\s+)?i\s+need\s+to\s+complete.*",
        r"\s+which\s+i\s+have\s+to\s+submit.*",
        r"\s+which\s+i\s+need\s+to\s+submit.*",
        r"\s+on\s+\d+(?:st|nd|rd|th)?\s+of\s+(?:this|current|next)\s+month.*",
        r"\s+by\s+\d+(?:st|nd|rd|th)?\s+of\s+(?:this|current|next)\s+month.*",
        r"\s+on\s+(?:the\s+)?\d+(?:st|nd|rd|th)?\b.*",
        r"\s+by\s+(?:the\s+)?\d+(?:st|nd|rd|th)?\b.*",
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
        "today maths faculty gave us new",
        "today maths faculty gave us",
        "today faculty gave us new",
        "today faculty gave us",
        "today my faculty gave us new",
        "today my faculty gave us",
        "today teacher gave us new",
        "today teacher gave us",
        "today professor gave us new",
        "today professor gave us",
        "my faculty or teacher gave me new",
        "my faculty or teacher gave me",
        "my faculty gave me new",
        "my faculty gave me",
        "my faculty gave us new",
        "my faculty gave us",
        "my teacher gave me new",
        "my teacher gave me",
        "my professor gave me new",
        "my professor gave me",
        "teacher gave me new",
        "teacher gave me",
        "faculty gave me new",
        "faculty gave me",
        "faculty gave us new",
        "faculty gave us",
        "professor gave me new",
        "professor gave me",
        "gave me new",
        "gave me",
        "gave us new",
        "gave us",
        "assigned me new",
        "assigned me",
        "assigned us new",
        "assigned us",
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

    def _call_gemini(self, prompt: str) -> str:
        client = self._get_client()
        candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"]
        unique_models = []
        for m in candidate_models:
            if m and m not in unique_models:
                unique_models.append(m)

        last_err = None
        for model_name in unique_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=EXTRACTION_SYSTEM_INSTRUCTION,
                        temperature=0.2,
                        response_mime_type="application/json",
                    ),
                )
                if response.text:
                    return response.text
            except Exception as e:
                last_err = e
                logger.warning("Gemini model %s failed: %s. Trying next...", model_name, e)
                continue
        raise last_err or Exception("All Gemini models failed")

    def _parse_and_validate(self, raw_text: str) -> ExtractionResult:
        parsed = json.loads(raw_text)
        return ExtractionResult.model_validate(parsed)

    def extract_from_journal(
        self,
        entry_text: str,
        existing_goals: list[str] | None = None,
    ) -> ExtractionResult:
        prompt = build_extraction_prompt(entry_text, existing_goals)
        raw_text = self._call_gemini(prompt)

        last_error: Exception | None = None
        for attempt in range(2):
            try:
                return self._parse_and_validate(raw_text)
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                if attempt >= 1:
                    break
                repair_prompt = REPAIR_PROMPT_TEMPLATE.format(
                    schema=ExtractionResult.model_json_schema(),
                    previous_response=raw_text,
                    error=str(exc),
                )
                raw_text = self._call_gemini(repair_prompt)

        raise GeminiExtractionError(
            f"Gemini response failed validation after repair attempt: {last_error}",
            raw_response=raw_text,
        ) from last_error

    def analyze_journal(
        self, content: str, existing_goals: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Analyzes a daily journal entry using Gemini Flash-Lite and extracts structured
        mood, activities (completed vs ongoing vs planned), blockers, and goal linkages.
        """
        current_today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        goals_context = ""
        if existing_goals:
            goals_list_str = "\n".join(
                [f"- ID: {g.get('id')} | Title: {g.get('title')} | Status: {g.get('status')}" for g in existing_goals]
            )
            goals_context = f"\nUser's Current Active Goals:\n{goals_list_str}\n"

        prompt = f"""You are an expert AI Goal Journal & Accountability Coach analyzing a user's daily journal entry.
Today's Date: {current_today_str}

ATTENTION MECHANISM & FOCUS RULES:
- RULE 1 (BACKSTAGING vs ACTIVE TODAY): Separate historical commitments or background context ("backstaging") from concrete actions executed today. Pay primary attention to what the user actively worked on today.
- RULE 2 (STRICT STATUS CLASSIFICATION):
   - 'completed': Tasks finished today ("finished chapter 3", "submitted PR").
   - 'ongoing': Tasks currently in progress ("working on presentation").
   - 'planned': Intentions for the future ("will study tomorrow").
   Do NOT mark planned tasks as completed!
- RULE 3 (AUTOMATIC GOAL DETECTION & DEDUPLICATION):
   Identify explicit or strong implicit commitments to new medium/long-term objectives, including teacher/faculty assignments ("I want to learn Docker", "Aiming to run 5k", "Planning to launch portfolio", "Faculty gave me new ES assignment to submit by tomorrow", "Maths faculty gave assignment due on 12th of this month").
   When user mentions faculty/teacher assignments, clean title (e.g. "Submit Maths Assignment"), set category to 'Learning', and extract exact target date.
   If the intention already corresponds to an existing goal from the context below, set "is_new": false and provide "matched_existing_goal_id".
   Assign a confidence score (0.0 to 1.0) and suggest a category ('Career', 'Learning', 'Health', 'Finance', 'Personal', or 'Other').
   If target date is mentioned (e.g., "by tomorrow", "12th of this month", "on 12th", "by 15th"), calculate the exact target date relative to Today's Date ({current_today_str}). Ensure the target date ISO format is YYYY-MM-DD.
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

        candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"]
        unique_models = []
        for m in candidate_models:
            if m and m not in unique_models:
                unique_models.append(m)

        client = self._get_client()
        last_e = None
        for model_name in unique_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                cleaned = _clean_json_response(response.text)
                parsed = json.loads(cleaned)
                return self._normalize_analysis_result(parsed, content)
            except Exception as e:
                last_e = e
                logger.warning("Gemini model %s analysis failed: %s. Trying fallback model...", model_name, e)
                continue

        logger.error("All Gemini analysis models failed: %s", last_e)
        return self._rule_based_fallback(content, str(last_e))

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

    def generate_goal_roadmap(
        self, goal_title: str, timeline: str = "Self-paced", level: str = "Beginner", goal_id: Optional[str] = None
    ) -> RoadmapResponse:
        """
        Generates a structured learning roadmap for a given goal title, timeline, and level.
        Falls back to rule-based roadmap generator if Gemini API key is missing or fails.
        """
        system_instruction = (
            "You are an expert curriculum designer and personal achievement coach. "
            "Your task is to break down any goal into a sequential, practical roadmap.\n"
            "Constraints:\n"
            "1. 4 to 8 sequential milestones.\n"
            "2. Order by logical dependency.\n"
            "3. Actionable outcomes and concrete capstone checkpoints.\n"
            "4. Provide realistic estimated durations."
        )

        user_prompt = f"Generate a structured learning roadmap for: {goal_title} (Pace: {timeline}, Level: {level})"

        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=RoadmapResponse,
                ),
            )
            parsed: RoadmapResponse = response.parsed
            if parsed and parsed.milestones:
                parsed.goal_id = goal_id
                parsed.goal_title = goal_title
                parsed.total_milestones = len(parsed.milestones)
                completed_count = sum(1 for m in parsed.milestones if m.completed)
                parsed.completed_count = completed_count
                parsed.progress_percentage = int((completed_count / len(parsed.milestones)) * 100) if parsed.milestones else 0
                parsed.created_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                return parsed
        except Exception as e:
            logger.warning("Gemini roadmap generation fallback triggered: %s", e)

        fallback = self._rule_based_roadmap_fallback(goal_title, timeline, level)
        fallback.goal_id = goal_id
        return fallback

    def _rule_based_roadmap_fallback(
        self, goal_title: str, timeline: str = "Self-paced", level: str = "Beginner"
    ) -> RoadmapResponse:
        """Rule-based fallback for generating structured roadmaps when Gemini API is unavailable."""
        title_lower = goal_title.lower()
        if "python" in title_lower:
            milestones = [
                Milestone(step_number=1, title="Python Fundamentals & Syntax", short_description="Variables, data types, loops, and control flow", estimated_duration="1 week", key_action_item="Write 5 basic Python scripts solving math & text problems", completed=False),
                Milestone(step_number=2, title="Data Structures & OOP", short_description="Lists, dicts, tuples, classes, and inheritance", estimated_duration="1-2 weeks", key_action_item="Build a CLI-based task manager using classes", completed=False),
                Milestone(step_number=3, title="Modules & Packages", short_description="Working with PyPI, virtualenvs, pip, and standard library", estimated_duration="1 week", key_action_item="Create a custom module and consume external APIs", completed=False),
                Milestone(step_number=4, title="Backend API Development", short_description="FastAPI / Flask basics, endpoints, and JSON responses", estimated_duration="2 weeks", key_action_item="Build a RESTful API with CRUD operations", completed=False),
                Milestone(step_number=5, title="Capstone Project & Testing", short_description="Writing pytest unit tests and deploying the application", estimated_duration="2 weeks", key_action_item="Deploy your Python web service online", completed=False),
            ]
        elif "frontend" in title_lower or "web" in title_lower or "html" in title_lower:
            milestones = [
                Milestone(step_number=1, title="Semantic HTML5 & Accessible Structure", short_description="Master document structure, semantic tags, forms, and ARIA basics", estimated_duration="1-2 weeks", key_action_item="Build an accessible multi-page product landing page", completed=False),
                Milestone(step_number=2, title="Modern CSS, Flexbox & Grid", short_description="Box model, responsive design with media queries, Flexbox, and Grid", estimated_duration="2 weeks", key_action_item="Style landing page to be responsive across all devices", completed=False),
                Milestone(step_number=3, title="JavaScript Fundamentals & DOM", short_description="ES6+ syntax, functions, events, DOM manipulation, and fetch API", estimated_duration="2 weeks", key_action_item="Build an interactive web app with dynamic UI updates", completed=False),
                Milestone(step_number=4, title="React Fundamentals", short_description="Components, props, state, hooks (useState, useEffect), and routing", estimated_duration="2 weeks", key_action_item="Convert JavaScript app into a component-driven React app", completed=False),
                Milestone(step_number=5, title="State Management & Production Build", short_description="Context API, state optimization, Vite bundling, and deployment", estimated_duration="1-2 weeks", key_action_item="Deploy React application to Vercel/Netlify", completed=False),
            ]
        elif any(k in title_lower for k in ["aws", "cloud", "solutions architect", "devops", "azure", "gcp", "certif"]):
            milestones = [
                Milestone(step_number=1, title="Cloud Fundamentals & IAM Security", short_description="Global infrastructure, IAM users, roles, policies, and least-privilege access", estimated_duration="1-2 weeks", key_action_item="Configure multi-factor IAM root and least-privilege admin roles with CLI", completed=False),
                Milestone(step_number=2, title="Compute & Resilient Networking (VPC & EC2)", short_description="Custom VPCs, public/private subnets, NAT gateways, route tables, and Auto Scaling EC2", estimated_duration="2 weeks", key_action_item="Deploy high-availability EC2 instances across 2 AZs behind an ALB", completed=False),
                Milestone(step_number=3, title="Storage & Managed Databases (S3 & RDS)", short_description="S3 lifecycle policies, storage classes, RDS Multi-AZ failover, and DynamoDB", estimated_duration="2 weeks", key_action_item="Build static site on S3 with CloudFront CDN and connect to RDS PostgreSQL", completed=False),
                Milestone(step_number=4, title="Serverless & Event-Driven Architecture", short_description="AWS Lambda, API Gateway, SQS queues, SNS topics, and EventBridge decoupling", estimated_duration="2 weeks", key_action_item="Build asynchronous image-processing microservice using S3, SQS, and Lambda", completed=False),
                Milestone(step_number=5, title="Security Auditing, CloudWatch & Cost Optimization", short_description="CloudWatch alarms, CloudTrail auditing, AWS Budgets, and Trusted Advisor", estimated_duration="1-2 weeks", key_action_item="Configure budget threshold alerts and automated metric alarms", completed=False),
                Milestone(step_number=6, title="Practice Exams & Certification Readiness", short_description="Full-length timed practice exams, reviewing question domains and whitepapers", estimated_duration="1-2 weeks", key_action_item="Score 85%+ on two consecutive full-length practice exams", completed=False),
            ]
        else:
            milestones = [
                Milestone(step_number=1, title=f"Foundation & Core Concepts of {goal_title}", short_description="Understand essential principles, terminology, and setup", estimated_duration="1 week", key_action_item="Complete foundational reading and setup dev environment", completed=False),
                Milestone(step_number=2, title="Hands-on Practice & Fundamentals", short_description="Practice core skills through small exercises and tutorials", estimated_duration="1-2 weeks", key_action_item="Complete 3 hands-on practical exercises", completed=False),
                Milestone(step_number=3, title="Intermediate Techniques & Projects", short_description="Combine skills into structured mini-projects", estimated_duration="2 weeks", key_action_item="Build first functional mini-project", completed=False),
                Milestone(step_number=4, title="Advanced Optimization & Mastery", short_description="Refine skills, address edge cases, and best practices", estimated_duration="2 weeks", key_action_item="Perform peer review / self-audit of your project", completed=False),
                Milestone(step_number=5, title="Capstone Delivery & Reflection", short_description="Deliver final milestone project and evaluate outcome", estimated_duration="1 week", key_action_item="Publish capstone project and document learnings", completed=False),
            ]

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return RoadmapResponse(
            goal_title=goal_title,
            total_milestones=len(milestones),
            estimated_total_duration=timeline,
            milestones=milestones,
            completed_count=0,
            progress_percentage=0,
            created_at=now_str,
        )

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
