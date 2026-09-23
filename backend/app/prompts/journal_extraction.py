"""
app/prompts/journal_extraction.py

Prompt updated to target the simpler, consistent schema
(goals[title,status] / completed_activities[] / blockers[]) instead of
the richer Day 1-3 shape. Same underlying prompt-engineering principles
as before (role framing, delimiters, explicit constraints, internal
tense classification) — just a flatter target structure.
"""

SYSTEM_INSTRUCTION = """\
You are analyzing a personal journal entry to extract structured
goal-tracking data for a productivity coaching app. You are precise,
conservative, and never invent information that is not supported by
the entry text.
"""

JSON_SCHEMA_INSTRUCTIONS = """\
Return ONLY valid JSON matching exactly this schema. No markdown fences,
no commentary, no text before or after the JSON object. Every field is
required — use an empty list [] where nothing applies, never omit a key.

{
  "goals": [
    {
      "title": "string",
      "status": "Active | Completed | Stalled"
    }
  ],
  "completed_activities": ["string"],
  "blockers": ["string"]
}
"""

INSTRUCTIONS = """\
Follow these steps:

1. Read the journal entry inside the <journal_entry> tags below.
2. Internally classify each relevant statement as PAST/COMPLETED,
   ONGOING, or FUTURE/INTENDED. Do not include this classification step
   in your output — use it only to decide the right fields.
3. Extract only what the user explicitly stated. Do NOT infer
   aspirational goals from passing mentions, and do NOT invent goals,
   activities, or blockers the entry does not support. If the entry
   has no clear goal, return an empty "goals" list rather than guessing.
4. For each goal, compare it against the EXISTING GOALS listed below.
   If it matches one (same underlying objective, even if worded
   differently), reuse that goal's exact title text and set its status
   based on what this entry says about it. Otherwise list it as a new
   goal with "status": "Active" (a brand-new goal is active by
   definition — only mark "Completed" or "Stalled" when the entry or
   existing context supports that).
5. "completed_activities" is a flat list of short strings describing
   what the user actually finished — PAST/COMPLETED statements only.
   Ongoing or planned work does NOT belong here.
6. "blockers" is a flat list of short strings describing anything the
   user says is preventing progress (e.g. "didn't have time", "kept
   getting distracted", "waiting on approval").
7. Output ONLY the JSON object described above, with all three keys
   always present.
"""


def build_extraction_prompt(entry_text: str, existing_goals: list[str] | None = None) -> str:
    """
    Build the full user-turn prompt for a single journal-entry extraction call.

    existing_goals: list of existing goal title strings (flat, since the
    Day 4 schema no longer carries goal IDs) used so the model reuses
    the same title instead of creating a near-duplicate goal.
    """
    existing_goals = existing_goals or []

    if existing_goals:
        goals_block = "\n".join(f"- {g}" for g in existing_goals)
    else:
        goals_block = "(none yet — this user has no existing goals on record)"

    return f"""\
{INSTRUCTIONS}

EXISTING GOALS:
{goals_block}

{JSON_SCHEMA_INSTRUCTIONS}

<journal_entry>
{entry_text.strip()}
</journal_entry>
"""