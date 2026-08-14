# Pages DOX Contract — src/pages/AGENTS.md

> **Subtree Scope**: Top-level route pages (`src/pages/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Provide the core user journeys and orchestrate data fetching, UI state, user input forms, and error handling:
- `Dashboard.jsx`: Executive overview, metrics, AI insights, recent entries, blockers, and weekly coach summary preview.
- `Journal.jsx`: Text journal editor, voice recording tab, live AI analysis breakdown, and interactive journal history.
- `Goals.jsx`: Goal tracker with status filters (Active, Completed, Stalled), create/edit modal, and activity associations.
- `AiCoach.jsx`: Dedicated on-demand weekly accountability summary view.
- `Profile.jsx`: View and edit user profile (Display Name, Profession, authoritative Email).
- `Login.jsx` & `Register.jsx`: Public authentication views.

---

## 2. Invariants & Rules

1. **Real Data Exclusively**:
   - Do NOT render fake static metrics or dummy journal records.
   - If no data is available from the backend, render descriptive empty states with actionable call-to-action buttons.
2. **Asynchronous State Handling**:
   - Every page that queries the backend must handle `loading`, `error`, and `success` states gracefully.
   - Use non-blocking loading skeletons or spinners.
3. **Structured AI Rendering**:
   - The Journal page must render the structured breakdown returned by Gemini: mood with confidence, activities tagged with completion status, blockers tagged with categories, and associated goals.
