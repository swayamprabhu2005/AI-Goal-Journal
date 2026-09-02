# Frontend DOX Contract — src/AGENTS.md

> **Subtree Scope**: All React frontend source files (`src/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)  
> **Target Runtime**: React 18, Vite 5, Tailwind CSS 3, React Router DOM 6, Anime.js

---

## 1. Responsibilities

The `src/` directory contains the complete Single Page Application (SPA) built with React 18 and Vite:
- **Client-Side Routing**: React Router DOM v6 managing public routes, guest landing page, and authenticated protected routes.
- **Application Views**:
  - `LandingPage.jsx` (`/`): Public showcase featuring hero, interactive preview, feature pillars, and call-to-actions.
  - `Dashboard.jsx` (`/dashboard`): Momentum overview, active goals with priority badges, and deterministic Productivity Score modal.
  - `Journal.jsx` (`/journal`): AI Journal dual text and voice reflection recording with local Whisper STT, Gemini semantic analysis, in-place result transition, and auto-scroll.
  - `Goals.jsx` (`/goals`): Goal management, Smart Priority badges (`High`, `Medium`, `Low`), estimated completion days, filter pills, and Canvas Confetti celebration.
  - `Calendar.jsx` (`/calendar`): Interactive monthly calendar matrix, date inspector, and deadline timeline with spacious layout padding.
  - `Habits.jsx` (`/habits`): Habit tracker with Monday–Sunday weekly grid, ordinal date numbers (`21st`), week navigation (`<`, `>`), optimistic check-offs, streaks, and Anime.js feedback.
  - `progress.jsx` (`/progress`): Pure-SVG progress trend chart, goal selector, latest/previous/change metric cards, completed goal milestone banner & badge, and chronological history timeline.
  - `AiCoach.jsx` (`/coach`): On-demand weekly AI accountability coach report with wins, recurring blockers, and personalized guidance.
  - `Profile.jsx` (`/profile`): User identity, occupation/profession settings, and activity statistics.
  - `Login.jsx` / `Register.jsx`: Firebase Authentication views.
- **Micro-Animations & Visual Celebrations**:
  - Pure Canvas Confetti celebration (`components/GoalCompletionCelebration.jsx`).
  - Anime.js motion helpers (`animations/motion.js`) with reduced-motion respect.
- **State Management**:
  - `AuthContext.jsx`: Firebase authentication session listener and token management.
  - `DataContext.jsx`: Shared caching for goals, journals, and weekly summaries with quiet background sync.
  - `ModalContext.jsx`: Global modal and toast notification system.
- **API Client**: Strongly typed Axios/Fetch client (`services/api.js`) attaching Firebase bearer tokens to all backend calls.

---

## 2. Core Rules & Invariants

1. **Firebase Authentication Integrity**:
   - Do NOT replace Firebase Authentication with local storage mocks or demo state.
   - Use `onAuthStateChanged` in `AuthContext.jsx` for all reactive session state.
   - Always attach the verified Firebase ID token (`Authorization: Bearer <token>`) to backend requests.
2. **Design Tokens & Calm Moss Aesthetic**:
   - Background: `bg-paper` (`#FAF9F6`) or `bg-slate-50`.
   - Text: Primary `text-ink` (`#1C1B1F`) or `text-slate-900`; secondary `text-slate-600`.
   - Brand Accents: Indigo / Moss (`#4F46E5`, `#5C7A4E`), Emerald (`#10B981`), Amber (`#F59E0B`), Rose (`#E11D48`).
   - Headings: `Fraunces` serif or bold sans display.
   - UI / Body: `Inter` sans-serif.
   - Panel tokens: `.panel`, `.primary-button`, `.input-field`, `.app-page`.
3. **No Secret Ingestion**:
   - Only `VITE_FIREBASE_*` variables may be referenced via `import.meta.env`.
   - `GEMINI_API_KEY` and `ENCRYPTION_KEY` must NEVER be exposed or referenced in client JavaScript.
4. **Accessible Components**:
   - Ensure all interactive buttons, inputs, and modals have explicit keyboard focus outlines, ARIA attributes, and accessible labels.

---

## 3. Subtree Directory Structure

- `animations/` — Anime.js motion helpers (`motion.js`).
- `assets/` — Static application branding (`logo.png`).
- `components/` — Reusable UI components:
  - `Sidebar.jsx` — Desktop and mobile navigation shell with brand logo.
  - `PublicNavbar.jsx` / `PublicFooter.jsx` — Public landing page headers and footers with brand logo.
  - `GoalCelebration.jsx` — Canvas Confetti completion celebration.
  - `GoalCalendar.jsx` — Reusable monthly calendar matrix and deadline inspector.
  - `CircularProgress.jsx` — SVG progress circle meter.
  - `LoadingSkeleton.jsx` — Pulse skeleton loaders.
  - `Pagination.jsx` — Pagination controls.
- `context/` — React Context providers (`AuthContext.jsx`, `DataContext.jsx`, `ModalContext.jsx`).
- `pages/` — Top-level views (Dashboard, Journal, Goals, Calendar, Habits, Progress, AiCoach, Profile, Login, Register, LandingPage).
- `services/` — Frontend API client and Firebase auth service wrappers (`api.js`, `authService.js`).
- `utils/` — Utility modules (`habitStorage.js`).
- `firebase.js` — Firebase modular SDK configuration.
- `App.jsx` — Router declarations and protected route wrappers.
- `index.css` — Tailwind styling tokens and animations.
