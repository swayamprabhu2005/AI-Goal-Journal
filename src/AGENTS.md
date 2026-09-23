# Frontend DOX Contract — src/AGENTS.md

> **Subtree Scope**: All React frontend source files (`src/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)  
> **Target Runtime**: React 18, Vite 5, Tailwind CSS 3, React Router DOM 6, Anime.js, Canvas Confetti

---

## 1. Responsibilities

The `src/` directory contains the complete Single Page Application (SPA) built with React 18 and Vite:
- **Client-Side Routing**: React Router DOM v6 managing public routes, guest landing page, and authenticated protected routes.
- **Application Views**:
  - `Landing.jsx` (`/`): Public showcase featuring hero, interactive preview, feature pillars, and call-to-actions.
  - `Dashboard.jsx` (`/dashboard`): Momentum overview, multi-goal progress trajectory with Calm Moss color mapping, portfolio summary metrics, active goals with priority badges, Productivity Score modal, and "Mood Rhythm & Well-being" card.
  - `Journal.jsx` (`/journal`): AI Journal dual text and voice reflection recording with local Whisper STT, Gemini semantic analysis, in-place Emotional State Pulse banner (mood, confidence, trigger keywords), and past entries with Calm Moss mood badges.
  - `Goals.jsx` (`/goals`): Goal management, priority tags (`High`, `Medium`, `Low`), estimated completion days, filter pills, and Canvas Confetti celebration.
  - `Calendar.jsx` (`/calendar`): Interactive monthly calendar matrix, date inspector, and deadline timeline with spacious layout padding.
  - `Habits.jsx` (`/habits`): Habit tracker with 0 ms instant render from cached data, Monday–Sunday weekly grid, ordinal date numbers (`21st`), week navigation (`<`, `>`), optimistic check-offs, streaks, one-way daily lock, and Anime.js feedback.
  - `progress.jsx` (`/progress`): Pure-SVG progress trend chart, goal selector, latest/previous/change metric cards, completed goal milestone banner & badge, 0 ms `progressTrendCache`, and chronological history timeline.
  - `AiCoach.jsx` (`/coach`): Dedicated two-way interactive conversational AI coach powered by Groq Cloud API (`openai/gpt-oss-120b`), rich formatted messages (`FormattedChatMessage.jsx`), context grounding, prompt pills, and real-time chat.
  - `Insights.jsx` (`/insights`): Dedicated weekly AI accountability summaries, habit consistency insights, and blocker analysis.
  - `Profile.jsx` (`/profile`): User identity, occupation/profession settings, and activity statistics.
  - `Auth.jsx`: Unified Firebase Authentication view supporting Email/Password, Google OAuth 2.0, and Microsoft OAuth 2.0.
- **Micro-Animations & Visual Celebrations**:
  - Pure Canvas Confetti celebration (`components/GoalCelebration.jsx`).
  - Anime.js motion helpers (`animations/motion.js`) with reduced-motion respect.
- **State Management**:
  - `AuthContext.jsx`: Firebase authentication session listener, Google and Microsoft OAuth helpers (`loginWithGoogle`, `loginWithMicrosoft`), token management, and logout redirecting to `/`.
  - `DataContext.jsx`: Shared caching for goals, journals, habits, and weekly summaries with optimistic updates.
  - `ModalContext.jsx`: Global modal and toast notification system.
- **API Client**: Strongly typed Axios/Fetch client (`services/api.js`) attaching Firebase bearer tokens to all backend calls, including `coachApi.chat` and enriched habit endpoints.

---

## 2. Core Rules & Invariants

1. **Firebase Authentication Integrity**:
   - Do NOT replace Firebase Authentication with local storage mocks or demo state.
   - Use `onAuthStateChanged` in `AuthContext.jsx` for all reactive session state.
   - Always attach the verified Firebase ID token (`Authorization: Bearer <token>`) to backend requests.
   - On user logout, navigate directly to `/` (Landing Page).
2. **Design Tokens & Calm Moss Aesthetic**:
   - Background: `bg-paper` (`#FAF9F6`) or `bg-slate-50`.
   - Text: Primary `text-ink` (`#1C1B1F`) or `text-slate-900`; secondary `text-slate-600`.
   - Brand Accents: Indigo / Moss (`#4F46E5`, `#5C7A4E`), Emerald (`#10B981`), Amber (`#F59E0B`), Rose (`#E11D48`).
   - Headings: `Fraunces` serif or bold sans display.
   - UI / Body: `Inter` sans-serif.
   - Panel tokens: `.panel`, `.primary-button`, `.input-field`, `.app-page`.
3. **No Secret Ingestion**:
   - Only `VITE_FIREBASE_*` variables may be referenced via `import.meta.env`.
   - `GEMINI_API_KEY`, `GROQ_API_KEY`, and `ENCRYPTION_KEY` must NEVER be exposed or referenced in client JavaScript.
4. **Accessible Components**:
   - Ensure all interactive buttons, inputs, and modals have explicit keyboard focus outlines, ARIA attributes, and accessible labels.

---

## 3. Subtree Directory Structure

- `animations/` — Anime.js motion helpers (`motion.js`).
- `animations/` — Anime.js motion helpers (`motion.js`).
- `assets/` — Static application branding (`logo.png`).
- `components/` — Reusable UI components:
  - `MoodBadge.jsx` — Calm Moss styled emotion badges for all 10 classes (`accomplishment`, `motivation`, `focus`, `gratitude`, `breakthrough`, `burnout`, `overwhelmed`, `frustration`, `guilt`, `neutral`).
  - `FormattedChatMessage.jsx` — Rich typography and formatted callout rendering for AI coaching responses.
  - `TrendChart.jsx` — Reusable vector SVG trend chart rendering multi-goal progression with Calm Moss palettes, milestone badges, tooltips, and empty states.
  - `Sidebar.jsx` — Desktop and mobile navigation shell with brand logo.
  - `Navbar.jsx` — Application top bar with user menu and clean logout redirect.
  - `PublicNavbar.jsx` / `PublicFooter.jsx` — Public landing page headers and footers with brand logo.
  - `GoalCelebration.jsx` — Canvas Confetti completion celebration.
  - `GoalCalendar.jsx` — Reusable monthly calendar matrix and deadline inspector.
  - `CircularProgress.jsx` — SVG progress circle meter.
  - `LoadingSkeleton.jsx` — Pulse skeleton loaders.
  - `Pagination.jsx` — Pagination controls.
- `context/` — React Context providers (`AuthContext.jsx`, `DataContext.jsx`, `ModalContext.jsx`).
- `pages/` — Top-level views (Dashboard, Journal, Goals, Calendar, Habits, progress, AiCoach, Insights, Profile, Auth, Landing).
- `services/` — Frontend API client (`api.js`, `coachApi`, `roadmapApi.js`) and Firebase auth service wrappers (`authService.js`).
- `utils/` — Utility modules (`habitStorage.js`).
- `firebase.js` — Firebase modular SDK configuration.
- `App.jsx` — Router declarations and protected route wrappers.
- `index.css` — Tailwind styling tokens and animations.
