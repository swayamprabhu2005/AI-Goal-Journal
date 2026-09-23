## System Architecture

The application follows a **modular layered architecture** consisting of a **React frontend**, **Firebase Authentication**, a **FastAPI backend**, a **Google Gemini AI processing service**, and a **PostgreSQL database**.

### Architecture Diagram

![AI Goal Journal Architecture](../architecture-diagram.png)

### Architecture Overview

```text
Client / Frontend
        ↓
Firebase Authentication
        ↓
FastAPI Backend
        ├── API Layer
        ├── Authentication & Authorization
        ├── Validation Layer
        ├── Service Layer
        └── Data Access Layer
        ↓
Google Gemini AI Processing Service
        ↓
PostgreSQL Database
```

### Backend Layers

* **API Layer:** Exposes REST endpoints such as `/users`, `/journals`, `/goals`, `/progress`, `/summaries`, `/timeline`, and `/ai/extract`.
* **Auth & Authorization:** Verifies Firebase ID tokens, extracts the Firebase UID, and authorizes access to user-specific data.
* **Validation Layer:** Uses **Pydantic schemas** for request validation and structured error handling.
* **Service Layer:** Contains business logic for users, journals, goals, progress tracking, summaries, timeline activities, and AI processing.
* **Data Access Layer:** Uses **SQLAlchemy ORM** and database models for interaction with PostgreSQL.

### AI Processing Workflow

```text
User Journal Entry (Text / Voice)
        ↓
Speech-to-Text (for voice entries)
        ↓
Gemini API Prompt
        ↓
Goal Extraction
        ↓
Task & Progress Detection
        ↓
Blocker Identification
        ↓
Structured JSON Response
        ↓
PostgreSQL Storage
```

### Data Flow Summary

1. User authenticates through **Firebase Authentication**.
2. The frontend receives a **Firebase ID Token**.
3. The token is sent with API requests to **FastAPI**.
4. FastAPI verifies the token and extracts the **Firebase UID**.
5. Journal content is processed by the **Gemini AI service**.
6. Gemini returns structured insights containing goals, completed activities, blockers, and progress information.
7. The backend stores journals and AI-generated insights in **PostgreSQL**.
8. The frontend retrieves the processed data and displays it through the dashboard, goals, progress tracking, weekly summaries, and analytics views.

### AI Processing Responsibilities

The Gemini AI service is responsible for:

* extracting goals from journal entries,
* identifying completed tasks and activities,
* detecting blockers and recurring challenges,
* estimating progress trends,
* generating personalized insights,
* producing weekly and periodic summaries.

### Cross-Cutting Concerns

* **Security:** Firebase ID Token verification, HTTPS communication, and user-level authorization.
* **Validation:** Pydantic validation and structured exception handling.
* **Logging:** Request logs, error logs, and debugging support.
* **Configuration:** Environment-variable-based configuration and `.env` management.
* **Scalability:** Modular architecture that allows new AI services, APIs, and frontend features to be added with minimal coupling.
