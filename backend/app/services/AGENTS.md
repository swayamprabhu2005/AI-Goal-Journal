# Services Subtree DOX Contract — backend/app/services/AGENTS.md

> **Subtree Scope**: Business logic, AI extraction, and speech processing (`backend/app/services/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

- **`whisper_service.py`**:
  - Encapsulates `faster_whisper.WhisperModel` initialized strictly with `model_size_or_path="tiny"`, `device="cpu"`, `compute_type="int8"`.
  - Lazy-loaded singleton; manages temporary file creation and immediate deletion in `finally` blocks.
- **`gemini_service.py`**:
  - Official `google-genai` SDK integration using `gemini-3.1-flash-lite`.
  - Structured prompt engineering: extracting mood, activities (distinguishing completed vs planned vs ongoing), blockers (categorized), and goal associations.
  - Weekly summary synthesis from in-memory records.
- **`goal_service.py`**:
  - Deterministic goal matching against user's active goals to prevent duplicate goals.
- **`journal_service.py`**:
  - Orchestrates journal lifecycle: saving text $\rightarrow$ calling Gemini analysis $\rightarrow$ matching goals $\rightarrow$ persisting structured items.
- **`summary_service.py`**:
  - Gathers user's in-memory data for on-demand weekly coaching summary generation.

---

## 2. Invariants & Rules

1. **4 GB RAM PC Safeguard**:
   - `whisper_service.py` must never load any model larger than `tiny`.
   - Never run simultaneous transcription jobs.
2. **Deterministic Authority**:
   - Gemini suggestions must be filtered through deterministic backend logic before mutating goal statuses or linking activities.
3. **Data Loss Prevention**:
   - If Gemini raises an exception or returns unparseable output, the journal entry must still be persisted with an `ai_analysis=None` or error placeholder. Never drop the user's reflection.
