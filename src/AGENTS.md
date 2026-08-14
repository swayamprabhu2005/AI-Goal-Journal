# Frontend DOX Contract — src/AGENTS.md

> **Subtree Scope**: All React frontend source files (`src/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

The `src/` directory contains the complete Single Page Application (SPA) built with React 18 and Vite:
- Client-side routing with React Router DOM v6.
- Firebase modular authentication UI and state management.
- Browser-native voice recording with live transcript editing.
- Responsive Calm Moss UI design system (Tailwind CSS + Google Fonts).
- API client interfacing with FastAPI backend at `/api/v1/*`.

---

## 2. Core Rules & Invariants

1. **Firebase Authentication Integrity**:
   - Do NOT replace Firebase Authentication with local storage mocks or demo state.
   - Use `onAuthStateChanged` in `AuthContext.jsx` for all reactive session state.
   - Attach the Firebase ID token (`Bearer <token>`) to all authenticated backend requests.
2. **Design Tokens & Typography**:
   - Background: `bg-paper` (`#FAF9F6`).
   - Primary text: `text-ink` (`#1C1B1F`).
   - Brand accents: `moss-500` (`#5C7A4E`), `moss-600` (`#4A6440`), `moss-100` (`#DCE7D3`).
   - Alerts & errors: `ember` (`#B0492E`).
   - Headings: `font-display` (`Fraunces`, serif).
   - UI / Body: `font-body` (`Inter`, sans-serif).
3. **No Secret Ingestion**:
   - Only `VITE_FIREBASE_*` variables may be referenced via `import.meta.env`.
   - Never reference `GEMINI_API_KEY` or backend secrets.
4. **Accessible Components**:
   - Ensure all interactive buttons, inputs, and modals have explicit keyboard focus outlines, ARIA attributes, and accessible labels.

---

## 3. Subtree Directory Structure

- `components/` — Reusable, atomic UI components (Buttons, Cards, Inputs, VoiceRecorder, Shell).
- `context/` — Global context providers (`AuthContext`).
- `pages/` — Top-level view components (Dashboard, Journal, Goals, AiCoach, Profile, Login, Register).
- `services/` — External API and Firebase auth bindings (`api.js`, `authService.js`).
- `firebase.js` — Firebase SDK initialization module.
