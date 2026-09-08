import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.crypto import FieldEncryptionService, crypto_service, ENCRYPTION_PREFIX
from app.core.key_rotation import KeyRotationManager
from app.services.encryption_service import encryption_service
from app.repositories.postgres import journal_repo, summary_repo
from app.models.domain import JournalEntry, WeeklySummary
from app.schemas.journal import JournalCreate, JournalUpdate
from app.services.journal_service import journal_service
from app.services.summary_service import summary_service

# =========================================================================
# Mock Users for Multi-Tenant Security & BOLA Regression Testing
# =========================================================================

USER_ALICE = AuthenticatedUser(
    uid="regression_user_alice_101",
    email="alice@regression.test",
    name="Alice Regression",
)

USER_BOB = AuthenticatedUser(
    uid="regression_user_bob_202",
    email="bob@regression.test",
    name="Bob Regression",
)

MOCK_AI_ANALYSIS = {
    "title": "Security Regression Journal",
    "mood": "focused",
    "activities": [
        {"text": "Refactored security test suite", "status": "completed", "related_goal_hint": None}
    ],
    "goals": [],
    "blockers": [],
    "insights": ["Strong cryptographic isolation enforced."],
    "quick_summary": "Security regression journal entry.",
}


@pytest.fixture
def client_alice():
    """Client authenticated as User Alice."""
    app.dependency_overrides[get_current_user] = lambda: USER_ALICE
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def client_bob():
    """Client authenticated as User Bob."""
    app.dependency_overrides[get_current_user] = lambda: USER_BOB
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """Client with no authentication headers or overrides."""
    app.dependency_overrides.clear()
    return TestClient(app)


# =========================================================================
# 1. Authorized Decryption Regression Tests (HTTP Endpoint & Service Level)
# =========================================================================

def test_regression_authorized_decryption_http_endpoint(client_alice):
    """
    REGRESSION: Authenticated user creates a journal via HTTP API.
    - Response must be 201 Created with decrypted plaintext.
    - Subsequent GET requests must return decrypted plaintext.
    - Storage layer MUST hold encrypted ciphertext with 'enc:v1:' prefix.
    """
    plain_content = "Confidential medical reflection: managing stress through mindfulness."

    with patch("app.services.gemini_service.gemini_service.analyze_journal", return_value=MOCK_AI_ANALYSIS):
        # 1. Create journal
        post_resp = client_alice.post(
            "/api/v1/journals",
            json={"content": plain_content, "source": "text"},
        )
        assert post_resp.status_code == 201
        data = post_resp.json()
        journal_id = data["id"]
        assert data["content"] == plain_content

        # 2. Retrieve journal via GET /journals/{id}
        get_resp = client_alice.get(f"/api/v1/journals/{journal_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["content"] == plain_content

        # 3. Retrieve journal in list
        list_resp = client_alice.get("/api/v1/journals")
        assert list_resp.status_code == 200
        alice_entries = list_resp.json()
        matching = [e for e in alice_entries if e["id"] == journal_id]
        assert len(matching) == 1
        assert matching[0]["content"] == plain_content

        # 4. Storage check: Raw repository record MUST be encrypted
        raw_record = journal_repo.get_by_id(user_id=USER_ALICE.uid, journal_id=journal_id)
        assert raw_record is not None
        assert raw_record.content.startswith(ENCRYPTION_PREFIX)
        assert plain_content not in raw_record.content


# =========================================================================
# 2. Unauthorized User Access & Tenant Isolation (BOLA Protection)
# =========================================================================

def test_regression_unauthorized_user_access_blocked():
    """
    REGRESSION: Cross-user tenant isolation (Broken Object Level Authorization).
    - User Bob must NEVER be able to read, update, or delete User Alice's journal.
    - Unauthenticated requests must receive HTTP 401.
    """
    client = TestClient(app)
    alice_secret = "Alice's proprietary startup ideas and pitch deck outline."

    # 1. As Alice, create a journal
    app.dependency_overrides[get_current_user] = lambda: USER_ALICE
    with patch("app.services.gemini_service.gemini_service.analyze_journal", return_value=MOCK_AI_ANALYSIS):
        post_resp = client.post(
            "/api/v1/journals",
            json={"content": alice_secret, "source": "text"},
        )
        assert post_resp.status_code == 201
        alice_journal_id = post_resp.json()["id"]

    # 2. Switch authenticated user to Bob
    app.dependency_overrides[get_current_user] = lambda: USER_BOB

    # Bob attempts GET /journals/{alice_journal_id} -> Must return 404
    bob_get_resp = client.get(f"/api/v1/journals/{alice_journal_id}")
    assert bob_get_resp.status_code == 404
    assert alice_secret not in bob_get_resp.text

    # Bob lists all journals -> Must NOT contain Alice's journal
    bob_list_resp = client.get("/api/v1/journals")
    assert bob_list_resp.status_code == 200
    bob_journals = bob_list_resp.json()
    assert not any(j["id"] == alice_journal_id for j in bob_journals)

    # Bob attempts PUT /journals/{alice_journal_id} -> Must return 404
    bob_put_resp = client.put(
        f"/api/v1/journals/{alice_journal_id}",
        json={"content": "Malicious overwrite attempt"},
    )
    assert bob_put_resp.status_code == 404

    # Bob attempts DELETE /journals/{alice_journal_id} -> Must return 404
    bob_del_resp = client.delete(f"/api/v1/journals/{alice_journal_id}")
    assert bob_del_resp.status_code == 404

    # 3. As Unauthenticated user (no token / no auth override)
    app.dependency_overrides.clear()
    unauth_resp = client.get(f"/api/v1/journals/{alice_journal_id}")
    assert unauth_resp.status_code == 401


# =========================================================================
# 3. Encrypted Database Storage Multi-Model Verification
# =========================================================================

def test_regression_encrypted_database_storage_at_rest():
    """
    REGRESSION: Verify that all sensitive entities in repositories are encrypted.
    - JournalEntry.content -> encrypted with 'enc:v1:'
    - WeeklySummary.coaching_suggestion -> encrypted with 'enc:v1:'
    """
    user_id = "test_at_rest_user_888"
    journal_text = "Highly private personal reflection."
    coaching_text = "Confidential life coaching feedback."

    mock_summary = {
        "headline": "Weekly Review",
        "wins": ["Consistent gym routine"],
        "recurring_blockers": [],
        "goal_status_changes": [],
        "mood_trend": "positive",
        "coaching_suggestion": coaching_text,
    }

    with patch("app.services.gemini_service.gemini_service.analyze_journal", return_value=MOCK_AI_ANALYSIS):
        journal = journal_service.create_journal(user_id=user_id, data=JournalCreate(content=journal_text, source="text"))

    with patch("app.services.gemini_service.gemini_service.generate_weekly_summary", return_value=mock_summary):
        summary = summary_service.generate_weekly_summary(user_id=user_id, user_name="Regression User")

    # 1. Raw Journal Storage Check
    raw_j = journal_repo.get_by_id(user_id=user_id, journal_id=journal.id)
    assert raw_j is not None
    assert raw_j.content.startswith(ENCRYPTION_PREFIX)
    assert journal_text not in raw_j.content

    # 2. Raw Weekly Summary Storage Check
    raw_s = summary_repo.get_latest_by_user(user_id=user_id)
    assert raw_s is not None
    assert raw_s.coaching_suggestion.startswith(ENCRYPTION_PREFIX)
    assert coaching_text not in raw_s.coaching_suggestion


# =========================================================================
# 4. Existing-Data Migration & Double-Encryption Prevention
# =========================================================================

def test_regression_existing_data_migration_and_double_encryption_prevention():
    """
    REGRESSION: Data migration of legacy unencrypted records (Swayam's task validation).
    - Detects plaintext vs ciphertext correctly.
    - Safely encrypts plaintext records.
    - Prevents double-encryption if migration is run repeatedly (idempotency).
    """
    user_id = "migration_test_user_777"
    legacy_content = "This is legacy plaintext data created before field encryption was deployed."

    # 1. Manually insert unencrypted legacy journal into repository
    legacy_entry = JournalEntry(
        id="legacy_entry_001",
        user_id=user_id,
        content=legacy_content,
        source="text",
        title="Pre-Encryption Entry"
    )

    # PostgreSQL generates the actual journal ID
    saved_legacy = journal_repo.create(legacy_entry)
    legacy_id = saved_legacy.id

    # 2. Verify crypto_service detects unencrypted state
    assert not crypto_service.is_encrypted(saved_legacy.content)

    # 3. Simulate migration step: Encrypt legacy record
    migrated_content = crypto_service.encrypt(saved_legacy.content)

    assert crypto_service.is_encrypted(migrated_content)
    assert migrated_content.startswith(ENCRYPTION_PREFIX)
    assert crypto_service.decrypt(migrated_content) == legacy_content

    # Update the actual PostgreSQL record
    journal_repo.update(
        user_id=user_id,
        journal_id=legacy_id,
        content=migrated_content
    )

    # 4. Double-Encryption Prevention:
    # Running migration a second time on the same record
    second_pass_content = crypto_service.encrypt(migrated_content)

    # The output MUST be identical;
    # it must NOT re-wrap as 'enc:v1:enc:v1:...'
    assert second_pass_content == migrated_content
    assert not second_pass_content.startswith(
        f"{ENCRYPTION_PREFIX}{ENCRYPTION_PREFIX}"
    )
    assert crypto_service.decrypt(second_pass_content) == legacy_content

# =========================================================================
# 5. Wrong / Missing Encryption Key Safety
# =========================================================================

def test_regression_wrong_or_missing_encryption_key_safety():
    """
    REGRESSION: System fails safely when keys are wrong or corrupted.
    - Tampered ciphertext raises clean ValueError.
    - Mismatched key raises ValueError.
    - Decrypting plaintext returns plaintext safely.
    - Empty strings return empty strings without crashing.
    """
    service_main = FieldEncryptionService(primary_key_str="correct-production-key-32bytes!")
    service_wrong = FieldEncryptionService(primary_key_str="attacker-or-wrong-key-32bytes!!")

    secret = "Top confidential executive notes."
    ciphertext = service_main.encrypt(secret)

    # 1. Wrong key fails safely with ValueError
    with pytest.raises(ValueError):
        service_wrong.decrypt(ciphertext)

    # 2. Tampered ciphertext fails safely
    tampered = ciphertext[:-4] + "ZZZZ"
    with pytest.raises(ValueError):
        service_main.decrypt(tampered)

    # 3. Plaintext backward compatibility passes safely
    assert service_main.decrypt("Unencrypted note") == "Unencrypted note"

    # 4. None and empty inputs pass safely
    assert service_main.encrypt(None) is None
    assert service_main.decrypt(None) is None
    # AES-GCM roundtrips empty string to empty string
    assert service_main.decrypt(service_main.encrypt("")) == ""
    # EncryptionService handles empty strings cleanly
    assert encryption_service.encrypt_text("") == ""
    assert encryption_service.decrypt_text("") == ""


# =========================================================================
# 6. Journal Full CRUD Lifecycle with Active Encryption
# =========================================================================

def test_regression_journal_crud_lifecycle_http(client_alice):
    """
    REGRESSION: Full CRUD cycle over HTTP with active encryption.
    - Create -> 201 Created (decrypted returned, ciphertext stored)
    - Read -> 200 OK (decrypted returned)
    - Update -> 200 OK (updated decrypted returned, new ciphertext stored)
    - Delete -> 200 OK
    - Verify deleted -> 404 Not Found
    """
    initial_text = "Phase 1: Starting new research project."
    updated_text = "Phase 2: Project expanded to include distributed systems."

    with patch("app.services.gemini_service.gemini_service.analyze_journal", return_value=MOCK_AI_ANALYSIS):
        # 1. Create
        create_res = client_alice.post("/api/v1/journals", json={"content": initial_text})
        assert create_res.status_code == 201
        journal_id = create_res.json()["id"]
        assert create_res.json()["content"] == initial_text

        # 2. Read
        read_res = client_alice.get(f"/api/v1/journals/{journal_id}")
        assert read_res.status_code == 200
        assert read_res.json()["content"] == initial_text

        # 3. Update
        update_res = client_alice.put(f"/api/v1/journals/{journal_id}", json={"content": updated_text})
        assert update_res.status_code == 200
        assert update_res.json()["content"] == updated_text

        # Verify storage is encrypted with updated text
        raw = journal_repo.get_by_id(user_id=USER_ALICE.uid, journal_id=journal_id)
        assert raw.content.startswith(ENCRYPTION_PREFIX)
        assert updated_text not in raw.content

        # 4. Delete
        delete_res = client_alice.delete(f"/api/v1/journals/{journal_id}")
        assert delete_res.status_code == 200

        # 5. Verify 404 after deletion
        get_deleted = client_alice.get(f"/api/v1/journals/{journal_id}")
        assert get_deleted.status_code == 404


# =========================================================================
# 7. AI / Gemini Processing Pipeline Zero-Knowledge in Storage
# =========================================================================

def test_regression_gemini_receives_decrypted_plaintext_in_ram():
    """
    REGRESSION: Verify Gemini receives decrypted plaintext in RAM,
    while repository maintains encrypted ciphertext at rest.
    """
    user_id = "ai_pipeline_reg_user_555"
    sample_journal = "Finished building the authentication module with Firebase."

    captured_prompt_text = []

    def mock_ai_worker(content, existing_goals=None):
        captured_prompt_text.append(content)
        return MOCK_AI_ANALYSIS

    with patch("app.services.gemini_service.gemini_service.analyze_journal", side_effect=mock_ai_worker):
        entry = journal_service.create_journal(user_id=user_id, data=JournalCreate(content=sample_journal))

    # Gemini received clean plaintext
    assert len(captured_prompt_text) == 1
    assert captured_prompt_text[0] == sample_journal
    assert not captured_prompt_text[0].startswith(ENCRYPTION_PREFIX)

    # Repository stored ciphertext
    raw = journal_repo.get_by_id(user_id=user_id, journal_id=entry.id)
    assert raw.content.startswith(ENCRYPTION_PREFIX)
    assert sample_journal not in raw.content
