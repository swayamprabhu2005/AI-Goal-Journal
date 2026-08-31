# User Data Encryption & Privacy Research

> **Role & Task**: Aditya Verlekar — Backend Architecture & Privacy Research  
> **Document Status**: Architectural Research Specification  
> **Target Stack**: React SPA $\rightarrow$ Firebase Auth $\rightarrow$ FastAPI Backend $\rightarrow$ PostgreSQL Database

---

## 1. Executive Summary

As personal journals contain sensitive reflections, thoughts, and career goals, robust data privacy standards must protect user entries at rest and in transit. This document outlines the application-layer encryption architecture recommended for securing user journals while preserving real-time Gemini AI analysis capabilities.

---

## 2. Architecture & Data Classification

```text
       What Data to Encrypt
───────────────────────────────────
  • journals.content        (HIGH)
  • journals.ai_analysis   (HIGH)
  • weekly_summaries       (HIGH)
  • users.email/name     (MEDIUM)
```

```text
                  Encryption & Decryption Flow
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  React Frontend  │ ──(HTTPS)───► │  FastAPI Backend │ ──(KMS DEK)──► │ PostgreSQL DB    │
│ (Bearer Token)   │               │ Decrypts in RAM  │               │ (AES-256-GCM)    │
└──────────────────┘               └────────┬─────────┘               └──────────────────┘
                                            │ (In-memory plain text)
                                            ▼
                                   ┌──────────────────┐
                                   │  Google Gemini   │
                                   │ Flash-Lite API   │
                                   └──────────────────┘
```

---

## 3. Encryption Strategy: Application-Layer Envelope Encryption

### Why Application-Layer Envelope Encryption?
- **Protection At Rest**: If the PostgreSQL database file or disk backup is leaked, data remains unreadable ciphertext without KMS access.
- **AI Integration Compatibility**: Unlike client-side E2EE (where the server cannot decrypt text without client keys), envelope encryption allows the FastAPI backend to decrypt journal content in memory specifically during a request to pass to `gemini-3.1-flash-lite`, discarding plain text immediately after request handling completes.

### Technical Specification
1. **Symmetric Cipher**: `AES-256-GCM` via Python `cryptography.hazmat.primitives.ciphers.aead.AESGCM`. AES-GCM provides authenticated encryption, guaranteeing confidentiality and data integrity.
2. **Key Management**:
   - Master Key Encryption Key (KEK) stored in Cloud KMS (Google Cloud KMS / AWS KMS / HashiCorp Vault).
   - Per-record Data Encryption Keys (DEKs) generated dynamically for each journal entry.
3. **Storage Format**:
   ```sql
   ALTER TABLE journals 
   ADD COLUMN encrypted_content BYTEA,
   ADD COLUMN encrypted_dek BYTEA,
   ADD COLUMN iv BYTEA;
   ```

---

## 4. Log Sanitization & Operational Guidelines

1. **Zero Secret Logging**: Ensure FastAPI logger filters out `Authorization` headers, Firebase ID tokens, raw journal body text, and `GEMINI_API_KEY`.
2. **TLS Enforced**: HTTPS/TLS 1.3 required for all frontend-to-backend network requests.
