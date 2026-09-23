# Frontend Services DOX Contract — src/services/AGENTS.md

> **Subtree Scope**: API client and Firebase service helpers (`src/services/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

- **`authService.js`**: Modular authentication service using Firebase Auth (`firebase/auth`). Exposes Email/Password credentials and OAuth 2.0 social sign-in (`GoogleAuthProvider`, `OAuthProvider('microsoft.com')`).
- **`api.js`**: Centralized HTTP client communicating with FastAPI backend `/api/v1/*`. Automatically injects the Firebase ID token in the `Authorization: Bearer <token>` header.

---

## 2. Invariants & Rules

1. **Token Injection**:
   - `getAuthHeaders()` must call `auth.currentUser.getIdToken()` to fetch or refresh the token.
2. **Auth Service Methods**:
   - `registerUser(email, password, displayName)`
   - `loginUser(email, password)`
   - `loginWithGoogle()` (opens Google OAuth popup)
   - `loginWithMicrosoft()` (opens Microsoft OAuth popup)
   - `logoutUser()`
   - `resetPassword(email)`
3. **API Methods Specification**:
   - `userApi`: `getProfile()`, `updateProfile(data)`
   - `journalApi`: `listJournals()`, `getJournal(id)`, `createJournal(data)`, `deleteJournal(id)`, `transcribeAudio(blob)`
   - `goalApi`: `listGoals(status)`, `createGoal(data)`, `updateGoal(id, data)`, `deleteGoal(id)`
   - `habitApi`: `getHabits()`, `toggleHabit(id, date)`
   - `coachApi`: `chat(message, recentMessages)`
   - `summaryApi`: `getWeeklySummary()`, `generateWeeklySummary()`
   - `progressApi`: `getGoalTrend(goalId, days)`
   - `roadmapApi`: `generateRoadmap(goalId)`, `toggleMilestone(roadmapId, milestoneId)`
4. **Error Normalization**:
   - HTTP errors must be parsed and raised as descriptive errors containing backend error messages.
