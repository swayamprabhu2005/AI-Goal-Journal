# AI Goal Journal & Accountability Coach — AGENTS.md

## Purpose

This repository contains the **AI Goal Journal & Accountability Coach** project.

This file provides a shared project context for developers and AI agents so that implementation, documentation, architecture decisions, and API contracts remain consistent across the repository.

---

## Project Overview

AI Goal Journal & Accountability Coach is an **AI-powered personal productivity platform** that transforms daily **voice or text journal entries** into structured goals, progress insights, blocker detection, and personalized coaching summaries.

The system is designed to reduce the manual effort required by traditional productivity and goal-tracking applications while improving accountability and consistency.

### Primary Capabilities

* Voice and text journaling
* AI-based goal extraction
* Automatic progress tracking
* Completed activity identification
* Blocker and recurring pattern detection
* Weekly AI-generated summaries
* Personalized coaching suggestions
* Goal dashboard and activity timeline

---

## Problem Statement

Traditional productivity applications require users to manually create goals, update task progress, maintain habit trackers, and review their own performance. Over time, this manual effort causes users to lose motivation and stop using these applications.

Journaling applications capture valuable daily experiences but typically fail to transform those entries into **structured goals, measurable progress, or actionable insights**.

This project bridges that gap by using **Artificial Intelligence to automatically analyze daily voice or text journals and generate actionable productivity insights and coaching recommendations**.

---

## Primary Users

* **Students** — study goals, assignments, placement preparation
* **Working Professionals** — project tracking, productivity improvement
* **Freelancers** — client and deadline management
* **Entrepreneurs** — business goals, meetings, weekly performance review

---

## Repository Structure

```text
AI-GOAL-JOURNAL/
├── AGENTS.md
├── backend/
├── frontend/
├── docs/
└── README.md
```

---

## Technology Stack

### Frontend

* React.js
* Tailwind CSS
* React Router

### Backend

* FastAPI
* Python 3.11+
* Pydantic
* SQLAlchemy ORM

### Database

* PostgreSQL

### Authentication

* Firebase Authentication
* Firebase ID Token verification

### AI Layer

* Google Gemini API
* Whisper-class speech-to-text service for voice transcription

### DevOps / Deployment

* GitHub
* GitHub Actions (planned CI/CD)
* Docker & Docker Compose
* Vercel (frontend deployment target)
* Railway or Render (backend and PostgreSQL deployment targets)

---

## High-Level Architecture

```text
React Frontend
        ↓
Firebase Authentication
        ↓
FastAPI REST API
        ↓
Service Layer
        ↓
SQLAlchemy ORM
        ↓
PostgreSQL Database
        ↓
Gemini AI + Speech-to-Text Services
```

### Component Responsibilities

| Component       | Responsibility                          |
| --------------- | --------------------------------------- |
| React Frontend  | User interface and API requests         |
| FastAPI Backend | Business logic, validation, and routing |
| SQLAlchemy      | Database abstraction layer              |
| PostgreSQL      | Persistent storage                      |
| Gemini AI       | Journal analysis and coaching insights  |
| Whisper / STT   | Voice transcription                     |

---

## Backend Conventions

The backend follows a **modular layered architecture**:

```text
backend/app/
├── api/
├── models/
├── schemas/
├── services/
├── db/
└── main.py
```

### API Design Principles

* RESTful endpoints
* JSON request/response format
* Pydantic validation for all incoming data
* Proper HTTP status codes
* User-scoped resource access
* Consistent response structure across services

### Current / Planned User APIs

* `GET /api/v1/users/health`
* `POST /api/v1/users/sync`
* `GET /api/v1/users/me`
* `PUT /api/v1/users/me`

---

## AI Workflow

```text
User Journal Entry (Text / Voice)
                ↓
Speech-to-Text (for voice entries)
                ↓
FastAPI Validation Layer
                ↓
Gemini Prompt Processing
                ↓
Structured JSON Extraction
                ↓
Goal / Activity / Blocker Validation
                ↓
PostgreSQL Storage
                ↓
Dashboard & Weekly Summary Updates
```

### Expected Structured Response

```json
{
  "goals": [],
  "completed_activities": [],
  "blockers": []
}
```

---

## Database Overview

Core entities identified during research:

* `users`
* `journal_entries`
* `goals`
* `progress` / `goal_updates`
* `weekly_summaries`
* `ai_insights`

### Key Relationships

* One **User** → many **Journal Entries**
* One **User** → many **Goals**
* One **Journal Entry** → many **AI-extracted goals**
* One **Goal** → many **Progress Updates**
* One **User** → many **Weekly Summaries**

All user-owned tables must include a **`user_id` foreign key** and all queries must be filtered by the authenticated user.

---

## Functional Scope

### Authentication

* User Registration
* Login / Logout
* Profile Management
* Firebase token verification

### Journal Module

* Create text journal
* Create voice journal
* Edit journal
* Delete journal
* View journal history

### AI Module

* Speech-to-Text
* Goal Extraction
* Task Identification
* Blocker Detection
* Progress Calculation
* AI Coaching Suggestions
* Weekly Summary Generation

### Goal Management

* Automatic goal creation proposals
* Goal progress updates
* Goal status management (Active, Completed, Stalled)
* Goal categories and timelines

### Dashboard

* Active goals
* Completed goals
* Progress charts
* Activity timeline
* Weekly AI insights
* Productivity summary widgets

---

## Non-Functional Requirements

### Performance

* Dashboard load target: **< 3 seconds**
* AI analysis target: **< 10 seconds**
* Support multiple simultaneous users

### Security

* Firebase Authentication
* HTTPS communication
* Secure API token handling
* JWT / Firebase ID token validation
* User-level authorization checks

### Maintainability

* Modular codebase
* Clean architecture principles
* Reusable frontend components
* API documentation through FastAPI Swagger/OpenAPI

---

## Frontend Architecture Guidance

The frontend should follow a **feature-based structure**:

```text
src/
  app/
  features/
    auth/
    journal/
    goals/
    dashboard/
    coaching/
    profile/
  shared/
    components/
    hooks/
    utils/
    services/
```

Reusable UI primitives should be placed under **`shared/components`**, while API calls should remain isolated in **`shared/services`**.

---

## Team Responsibilities

| Member       | Responsibility                            |
| ------------ | ----------------------------------------- |
| **Aditya**   | User Management & Backend Integration     |
| **Farah**    | Database & Journal Backend                |
| **Panshobh** | Frontend Foundation & UI/UX               |
| **Sheryl**   | Gemini AI Integration                     |
| **Swayam**   | Firebase Authentication & Voice Prototype |

---

## Documentation Structure

Project documentation is stored in:

```text
docs/agent0ai-doxx/
├── PROJECT_CONTEXT.md
├── PRD.md
├── PPT_STRUCTURE.md
└── README.md
```

These files provide:

* AI-agent onboarding context
* Product requirements
* Architecture references
* Presentation structure and project overview

---

## GitHub Workflow

The project follows a **feature-branch workflow**:

1. Create a feature branch from `main`.
2. Implement isolated changes.
3. Commit with meaningful messages.
4. Push the branch to GitHub.
5. Create a Pull Request for review before merging.

This allows multiple team members to work simultaneously without affecting the stable branch.

---

## Verification Checklist

### Backend

Run locally:

```bash
uvicorn app.main:app --reload
```

Verify Swagger Docs:

```text
http://127.0.0.1:8000/docs
```

### API Testing

Use **Postman** to test:

* Login / authentication flows
* User synchronization
* Journal CRUD endpoints
* Goal management endpoints
* AI analysis endpoints

### Documentation

* Ensure Markdown renders correctly in VS Code.
* Keep architecture diagrams and API references synchronized with implementation changes.
* Remove outdated instructions whenever workflows change.

---

## Current Development Focus

### Active Priorities

* User Profile API implementation
* Firebase UID → PostgreSQL user mapping
* SQLAlchemy + PostgreSQL integration
* Journal CRUD API completion
* Frontend authentication screens and journal UI
* Gemini structured JSON extraction and validation
* Voice recording and transcription integration
* Project documentation and architecture maintenance

---

## Important Constraint

AI-generated goal updates should **not automatically modify critical user goals without a review or confirmation step**. The original journal entry must remain the **source of truth**, and extracted goals or progress updates should be treated as **AI-generated suggestions** that can be accepted, edited, or rejected by the user.
