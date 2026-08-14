# Models Subtree DOX Contract — backend/app/models/AGENTS.md

> **Subtree Scope**: Domain entity models (`backend/app/models/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

Defines internal domain dataclasses / models representing persistent state in memory:
- `User`: `firebase_uid`, `email`, `display_name`, `profession`, `created_at`, `updated_at`.
- `Goal`: `id`, `user_id`, `title`, `description`, `category`, `status`, `target_date`, `created_at`, `updated_at`.
- `JournalEntry`: `id`, `user_id`, `content`, `source`, `created_at`, `updated_at`, `ai_analysis`.
- `WeeklySummary`: `id`, `user_id`, `headline`, `wins`, `recurring_blockers`, `goal_status_changes`, `mood_trend`, `coaching_suggestion`, `created_at`.

---

## 2. Invariants

- Domain models are decoupled from any ORM base (no SQLAlchemy DeclarativeBase).
- Timestamps must default to UTC datetimes.
