# Pages DOX Contract — src/pages/AGENTS.md

> **Subtree Scope**: Top-level route pages (`src/pages/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Provide the core user journeys and orchestrate data fetching, UI state, user input forms, and error handling:
- `Dashboard.jsx`: Executive overview, metrics, active goals with priority badges, real-time Progress Trend chart (`TrendChart.jsx`), summary analytics cards, and Productivity Score modal.
- `Journal.jsx`: AI Journal dual text and voice reflection recording with local Whisper STT, Gemini semantic analysis, in-place result transition, and auto-scroll.
- `Goals.jsx`: Goal tracker with status filters (Active, Completed, Stalled), Smart Priority badges, completion celebration, and create/edit modal.
- `progress.jsx`: Dedicated historical progress analytics, pure-SVG trend chart, goal selector, delta metrics (`change_from_previous`), completed milestone banner, and chronological history timeline.
- `Habits.jsx`: Monday–Sunday habit tracker with ordinal dates, week navigation, streaks, and optimistic check-offs.
- `Calendar.jsx`: Interactive monthly calendar matrix, date inspector, and deadline timeline.
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
