# API Subtree DOX Contract — backend/app/api/AGENTS.md

> **Subtree Scope**: API route definitions (`backend/app/api/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Define and handle all RESTful HTTP endpoints versioned under `/api/v1/`:
- `v1/users.py`: Profile retrieval (`GET /me`) and updates (`PUT /me`).
- `v1/journals.py`: Journal CRUD (`POST`, `GET`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`) and speech transcription (`POST /voice/transcribe`).
- `v1/goals.py`: Goal lifecycle management (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`).
- `v1/coach.py`: Two-way conversational AI coaching chat (`POST /chat`).
- `v1/habits.py`: Enriched habit tracker and daily check-offs (`GET /`, `POST /`, `POST /{id}/toggle`).
- `v1/progress.py`: Goal progress recording and historical trends (`POST /record`, `GET /goal/{goal_id}/trend`).
- `v1/productivity.py`: Personal Productivity Score calculation (`GET /productivity-score`).
- `v1/roadmap.py`: AI learning roadmap generation and milestone check-off (`POST /generate`, `POST /{roadmap_id}/milestone/{milestone_id}/toggle`).
- `v1/summaries.py`: Weekly AI accountability summaries (`GET /weekly`, `POST /weekly`).

---

## 2. Invariants & Rules

1. **Mandatory Token Auth**:
   - Every protected route must declare `current_user: AuthenticatedUser = Depends(get_current_user)`.
2. **HTTP Status Standards**:
   - Resource created: `201 Created`.
   - Successful query/update: `200 OK`.
   - Resource deleted: `204 No Content` or `200 OK`.
   - Bad request / validation error: `400 Bad Request` or `422 Unprocessable Entity`.
   - Unauthenticated: `401 Unauthorized`.
   - Resource not found: `404 Not Found`.
3. **Thin Controllers**:
   - Routes must delegate all business logic, AI operations, and data persistence to corresponding services and repositories.
