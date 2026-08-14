# Schemas Subtree DOX Contract — backend/app/schemas/AGENTS.md

> **Subtree Scope**: Pydantic request/response schemas (`backend/app/schemas/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Define Pydantic v2 schemas for data validation, serialization, and API contracts:
- `user.py`: `UserProfileUpdate`, `UserProfileResponse`, `UserStats`.
- `goal.py`: `GoalCreate`, `GoalUpdate`, `GoalResponse`, `GoalStatus` (`Active`, `Completed`, `Stalled`).
- `journal.py`: `JournalCreate`, `JournalUpdate`, `JournalResponse`, `ActivityItem`, `BlockerItem`, `GoalSuggestionItem`, `AIAnalysisResult`.
- `voice.py`: `VoiceTranscribeResponse`.
- `summary.py`: `WeeklySummaryResponse`.

---

## 2. Invariants

- Use Pydantic V2 syntax (`model_config = ConfigDict(from_attributes=True)`).
- Ensure strict type annotations and default values.
- AI analysis schema must support validation of Gemini-generated JSON.
