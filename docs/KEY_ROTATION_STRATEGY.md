# Cryptographic Key Rotation Strategy & Operational Guide

> **Author & Role**: Aditya Verlekar — Security Validation & Cryptography Architecture  
> **Target Environment**: FastAPI + AES-256-GCM + Google Gemini Flash-Lite + In-Memory / PostgreSQL  
> **Status**: Approved Specification & Verified Implementation  
> **Date**: September 2026  

---

## 1. Executive Summary & Objective

In compliance with **NIST SP 800-57 Recommendations for Key Management** and data protection standards (SOC 2, HIPAA, GDPR), encryption keys must be routinely rotated (e.g., annually, upon team offboarding, or immediately following an incident) without service interruption or historical data loss.

This specification documents the **zero-downtime, field-level key rotation architecture** designed and validated for the **AI Goal Journal & Accountability Coach** platform.

```text
┌─────────────────────────┐
│ Existing Encrypted Data │ (Encrypted with Key V1)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Old Key / Key Version  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Decrypt (RAM Only)    │ (Transient In-Memory Decryption)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   New Encryption Key    │ (Key V2)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Re-encrypted Data (V2)  │ (Persisted to Storage)
└─────────────────────────┘
```

---

## 2. Cryptographic Architecture & Envelope Format

### 2.1 Cipher Specification
- **Algorithm**: `AES-256-GCM` (Galois/Counter Mode) via Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM`.
- **Key Length**: 256 bits (32 bytes).
- **Initialization Vector (Nonce)**: 12-byte cryptographically secure random nonce (`os.urandom(12)`), generated independently for every encryption operation.
- **Authentication Tag**: 16-byte GCM authentication tag appended to ciphertext to guarantee data authenticity and tamper-resistance.

### 2.2 Wire & Storage Envelope
All encrypted fields are stored as prefixed ASCII strings:
```
enc:v1:<base64( 12-byte nonce + AES-GCM ciphertext + 16-byte tag )>
```

#### Envelope Properties:
1. **Self-Describing Prefix (`enc:v1:`)**: Allows the application to immediately distinguish between modern encrypted ciphertext, legacy unencrypted plaintext, and future envelope formats (`enc:v2:`).
2. **Transparent Backward Compatibility**: If an existing record lacks the `enc:v1:` prefix, the decryption routine returns the string as-is without raising exceptions or breaking API callers.
3. **Double-Encryption Prevention**: The encryption engine inspects the prefix prior to cipher execution; records already prefixed are returned untouched.

---

## 3. Configuration & Dual-Key Environment Setup

Key rotation relies on a **Dual-Key / Multi-Key Fallback Window** managed through environment variables in `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    # Primary active key for all new writes and re-encryptions
    ENCRYPTION_KEY: str = ""

    # Comma-separated list of historical keys for seamless fallback decryption
    ENCRYPTION_OLD_KEYS: str = ""

    # User field-level encryption configuration
    JOURNAL_ENCRYPTION_KEY: str = ""
```

### Environment Settings (`.env`):
```bash
# During normal operation (Single Key):
ENCRYPTION_KEY="primary-active-key-v1-32bytes!!"
ENCRYPTION_OLD_KEYS=""

# During active rotation window (Dual Key):
ENCRYPTION_KEY="brand-new-primary-key-v2-32bytes!"
ENCRYPTION_OLD_KEYS="primary-active-key-v1-32bytes!!"
```

---

## 4. Zero-Downtime 4-Phase Rotation Workflow

```mermaid
sequenceDiagram
    autonumber
    participant Ops as DevOps / Admin
    participant App as FastAPI Backend
    participant DB as Repository / DB
    participant Tool as KeyRotationManager

    Note over Ops,App: Phase 1: Dual-Key Staging
    Ops->>Ops: Generate Key V2
    Ops->>App: Set ENCRYPTION_KEY=V2, ENCRYPTION_OLD_KEYS=V1
    App-->>Ops: Reload service (New writes use V2; V1 decrypted via fallback)

    Note over Tool,DB: Phase 2: Batch Migration
    Ops->>Tool: Execute rotation script
    Tool->>DB: Fetch records (Journals, Summaries)
    Tool->>Tool: Decrypt using V1 -> Re-encrypt using V2
    Tool->>DB: Persist updated records

    Note over Ops,DB: Phase 3: Verification & Auditing
    Ops->>Tool: Run verify_rotation across all records
    Tool-->>Ops: 100% verified against Key V2

    Note over Ops,App: Phase 4: Key Deprecation
    Ops->>App: Remove V1 from ENCRYPTION_OLD_KEYS
    Ops->>Ops: Securely archive/destroy Key V1
```

### Phase 1: Dual-Key Staging & Deployment
1. Generate a new 256-bit cryptographic key:
   ```python
   from app.services.encryption_service import EncryptionService
   new_key = EncryptionService.generate_key()
   ```
2. Update the environment:
   - Set `ENCRYPTION_KEY` to the new Key (V2).
   - Place the previous key (V1) into `ENCRYPTION_OLD_KEYS`.
3. Restart or hot-reload the FastAPI application.
   - **Behavior**: Any incoming `create_journal` or `update_journal` immediately encrypts using **Key V2**.
   - **Read Access**: Any historical record encrypted with **Key V1** continues to decrypt seamlessly via `FieldEncryptionService._fallback_keys`. **Zero downtime occurs.**

### Phase 2: Batch Migration Execution
Execute the offline or background batch rotation process using `KeyRotationManager` (`backend/app/core/key_rotation.py`):

```python
from app.core.key_rotation import KeyRotationManager
from app.repositories.in_memory import journal_repo, summary_repo

rotator = KeyRotationManager(current_key=KEY_V1, new_key=KEY_V2)

# 1. Batch Rotate User Journals
for user_id in journal_repo.list_all_user_ids():
    for journal in journal_repo.get_all_by_user(user_id):
        rotated_content = rotator.rotate_text(journal.content)
        journal.content = rotated_content
        journal_repo.save(journal)

# 2. Batch Rotate Weekly Summaries
for user_id in summary_repo.list_all_user_ids():
    summary = summary_repo.get_latest_by_user(user_id)
    if summary and summary.coaching_suggestion:
        summary.coaching_suggestion = rotator.rotate_text(summary.coaching_suggestion)
        summary_repo.save(summary)
```

### Phase 3: Verification & Auditing
Before decommissioning the old key, the migration tool validates that all database rows:
1. Begin with `enc:v1:`.
2. Can be successfully decrypted using **Key V2 alone**.
3. Yield identical plaintext to the pre-rotation state.

### Phase 4: Old Key Retirement & Deprecation
1. Clear `ENCRYPTION_OLD_KEYS` in `.env`.
2. Cycle backend service instances.
3. Securely wipe Key V1 from deployment secrets managers (Google Secret Manager, AWS Secrets Manager, HashiCorp Vault).

---

## 5. Security Validation & Automated Test Matrix

The key-rotation and security implementation is rigorously verified through **17 automated test suites** in [`backend/tests/test_encryption.py`](file:///c:/Users/aditya%20verlekar/OneDrive/Desktop/New%20folder%20(5)/backend/tests/test_encryption.py):

| Verification Item | Test Function | Result |
| :--- | :--- | :---: |
| **At-Rest Storage Encryption** | `test_journal_entry_storage_is_encrypted` | **PASSED** |
| **Sensitive Summary Encryption** | `test_weekly_summary_storage_is_encrypted_and_decrypted_on_read` | **PASSED** |
| **Cross-User Data Isolation** | `test_cross_user_isolation_prevent_data_leakage` | **PASSED** |
| **Journal Full CRUD Lifecycle** | `test_journal_full_crud_lifecycle_with_encryption` | **PASSED** |
| **Gemini In-RAM Decryption** | `test_gemini_receives_decrypted_plaintext_internally` | **PASSED** |
| **Tamper Resistance (GCM)** | `test_tamper_resistance` | **PASSED** |
| **Incorrect Key Safety** | `test_incorrect_key_and_corrupted_payload_fail_safely` | **PASSED** |
| **Legacy Plaintext Coexistence** | `test_legacy_unencrypted_records_seamless_coexistence` | **PASSED** |
| **Multi-Key Fallback Decryption** | `test_multi_key_fallback_decryption` | **PASSED** |
| **KeyRotationManager Roundtrip** | `test_key_rotation_manager` | **PASSED** |
| **Batch Migration Lifecycle** | `test_batch_key_rotation_migration_workflow` | **PASSED** |
| **Aditya Encryption Service** | `test_encryption_decryption_cycle` | **PASSED** |
| **Plaintext Fallback Backward Compat** | `test_backward_compatibility_plaintext_fallback` | **PASSED** |
| **AI Processing RAM Helper** | `test_prepare_for_ai_processing` | **PASSED** |
| **Empty Input Sanitization** | `test_empty_string_handling` | **PASSED** |

---

## 6. Operational Incident & Rollback Playbook

1. **Rollback Scenario**: If a migration run aborts midway:
   - **Action**: Do **not** remove Key V1 from `ENCRYPTION_OLD_KEYS`.
   - The dual-key resolver continues decrypting both V1 and V2 records simultaneously without error.
2. **Key Compromise Response**:
   - Immediately spin up Key V3.
   - Set `ENCRYPTION_KEY=Key_V3`, `ENCRYPTION_OLD_KEYS=Key_V2,Key_V1`.
   - Run urgent batch re-encryption.
   - Expire compromised keys immediately once batch finishes.
