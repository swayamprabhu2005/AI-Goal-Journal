# App Core DOX Contract — backend/app/AGENTS.md

> **Subtree Scope**: FastAPI application root (`backend/app/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

`main.py` serves as the entry point for the FastAPI application. It configures:
- FastAPI instance with title, version, and OpenAPI metadata.
- CORS middleware allowing requests from `http://localhost:5173` and `http://127.0.0.1:5173`.
- Global exception handlers for standard HTTP errors and internal failures.
- Routing mounts under `/api/v1` (`users`, `journals`, `goals`, `summaries`).
- Service health endpoint at `/api/v1/health`.

---

## 2. Invariants

- Must maintain clean dependency injection across all routes.
- Must not contain inline database connection strings or ORM initialization.
