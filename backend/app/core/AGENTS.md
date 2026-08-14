# Core Subtree DOX Contract — backend/app/core/AGENTS.md

> **Subtree Scope**: Core configuration and security dependencies (`backend/app/core/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

- `config.py`: Centralized Pydantic Settings loading environment variables from `.env`.
- `auth.py`: Firebase Admin SDK initialization and FastAPI authentication dependency (`get_current_user`).

---

## 2. Invariants & Rules

1. **Firebase Admin Verification**:
   - `fb_auth.verify_id_token(token)` validates the cryptographic signature against Google public keys.
   - Extracts `uid`, `email`, and `name` into an immutable `AuthenticatedUser` model.
   - Raises `HTTPException(401, "Invalid or expired Firebase token")` on any verification failure.
2. **No Fallback Mock Auth in Production Routes**:
   - Live endpoints must strictly enforce real token validation.
   - Controlled test doubles are reserved exclusively for isolated unit tests.
