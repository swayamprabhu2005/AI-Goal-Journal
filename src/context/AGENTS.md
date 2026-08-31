# Context DOX Contract — src/context/AGENTS.md

> **Subtree Scope**: React Context Providers (`src/context/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

`AuthContext.jsx` manages the global authentication state of the application using Firebase Authentication's `onAuthStateChanged` listener.
`DataContext.jsx` manages the cached application data (User Profile, Goals, Journal History, AI Summaries) to ensure instant, flicker-free SPA route navigation.

---

## 2. Invariants & Rules

1. **Reactive Auth State**:
   - `user`: Holds the active Firebase User object or `null`.
   - `checkingAuth`: `true` while the initial Firebase SDK handshake completes, preventing premature redirects to `/login`.
2. **Global Data Caching**:
   - Cache user profile, goals, journals, and weekly AI summaries in memory.
   - Provide quiet background revalidation while rendering cached state instantly on route navigation.
3. **Exposed Helper Methods**:
   - Auth: `login(email, password)`, `register(email, password)`, `logout()`.
   - Data: `useData()` hook exposing cached state and sync helpers (`addGoal`, `addJournal`, `updateProfileInCache`, etc.).
4. **No Mock Bypass**:
   - Never inject hardcoded users or fake metrics into context state.
   - Any code consuming auth or workspace data must use `useAuth()` or `useData()`.
