# Repositories Subtree DOX Contract — backend/app/repositories/AGENTS.md

> **Subtree Scope**: Data persistence layer (`backend/app/repositories/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Encapsulate all data access and state storage behind clean repository interfaces:
- `base.py`: Defines abstract base classes (`AbstractUserRepository`, `AbstractGoalRepository`, `AbstractJournalRepository`, `AbstractSummaryRepository`).
- `in_memory.py`: Thread-safe, dictionary-backed repository implementations protected with `threading.Lock`.

---

## 2. Invariants & Rules

1. **Strict User Isolation**:
   - Every read, update, or delete method MUST accept `user_id` and ensure that only records owned by that `user_id` are returned or modified.
2. **Order of Records**:
   - Journal list queries must return newest entries first (`created_at` descending).
3. **Future PostgreSQL Boundary**:
   - Repositories accept domain inputs and return Pydantic schemas.
   - When PostgreSQL is introduced in a future phase, replacing `in_memory.py` with SQLAlchemy async repositories must require ZERO modifications to service layers or API routes.
