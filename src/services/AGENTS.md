# Frontend Services DOX Contract — src/services/AGENTS.md

> **Subtree Scope**: API client and Firebase service helpers (`src/services/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

- **`authService.js`**: Thin wrapper around Firebase modular authentication SDK (`firebase/auth`).
- **`api.js`**: Centralized HTTP client communicating with FastAPI backend `/api/v1/*`. Automatically injects the Firebase ID token in the `Authorization: Bearer <token>` header.

---

## 2. Invariants & Rules

1. **Token Injection**:
   - `getAuthHeaders()` must call `auth.currentUser.getIdToken()` to fetch or refresh the token.
2. **API Methods Specification**:
   - `userApi`: `getProfile()`, `updateProfile(data)`
   - `journalApi`: `listJournals()`, `getJournal(id)`, `createJournal(data)`, `deleteJournal(id)`, `transcribeAudio(blob)`
   - `goalApi`: `listGoals(status)`, `createGoal(data)`, `updateGoal(id, data)`, `deleteGoal(id)`
   - `summaryApi`: `getWeeklySummary()`, `generateWeeklySummary()`
3. **Error Normalization**:
   - HTTP errors must be parsed and raised as descriptive errors containing backend error messages.
