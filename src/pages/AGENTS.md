# Pages DOX Contract — src/pages/AGENTS.md

> **Subtree Scope**: Top-level route pages (`src/pages/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Provide the core user journeys and orchestrate data fetching, UI state, user input forms, and error handling:
- `Landing.jsx`: Public showcase featuring hero, interactive preview, feature pillars, and call-to-actions.
- `Dashboard.jsx`: Executive overview, portfolio metrics, active goals with priority badges, multi-goal real-time Progress Trajectory chart (`TrendChart.jsx` defaulting to all goals with distinct Calm Moss colors), summary analytics cards, and Productivity Score modal.
- `Journal.jsx`: AI Journal dual text and voice reflection recording with local Whisper STT, Gemini semantic analysis, in-place result transition, and auto-scroll.
- `Goals.jsx`: Goal management with status filters (Active, Completed, Stalled), priority tags (`High`, `Medium`, `Low`), completion celebration, and AI learning roadmap generator.
- `progress.jsx`: Dedicated historical progress analytics, pure-SVG trend chart, goal selector, delta metrics (`change_from_previous`), completed milestone banner, chronological history timeline, and 0 ms navigation via `progressTrendCache`.
- `Habits.jsx`: Monday–Sunday habit tracker with ordinal dates, week navigation, streaks, optimistic check-offs, and one-way daily completion lock.
- `Calendar.jsx`: Interactive monthly calendar matrix, date inspector, and deadline timeline.
- `AiCoach.jsx`: Dedicated two-way conversational AI coaching chat powered by Groq Cloud API, formatted markdown messages (`FormattedChatMessage.jsx`), context grounding, and prompt pills.
- `Insights.jsx`: Dedicated weekly AI summaries, habit consistency insights, and blocker analysis.
- `Profile.jsx`: View and edit user profile (Display Name, Profession, authoritative Email).
- `Auth.jsx`: Unified public authentication view supporting Email/Password, Google OAuth 2.0, and Microsoft OAuth 2.0.

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
