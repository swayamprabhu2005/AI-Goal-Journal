from unittest.mock import patch

import pytest

from app.core.crypto import FieldEncryptionService, crypto_service, ENCRYPTION_PREFIX
from app.core.key_rotation import KeyRotationManager
from app.services.journal_service import journal_service
from app.schemas.journal import JournalCreate, JournalUpdate
from app.repositories.postgres import journal_repo, summary_repo
from app.services.summary_service import summary_service
from app.services.encryption_service import encryption_service
from app.models.domain import JournalEntry


def test_field_encryption_and_decryption_roundtrip():
    sensitive_text = (
        "Private confidential reflection: "
        "I struggled with imposter syndrome today."
    )

    # Encrypt
    encrypted = crypto_service.encrypt(sensitive_text)
    assert encrypted.startswith(ENCRYPTION_PREFIX)
    assert sensitive_text not in encrypted

    # Decrypt
    decrypted = crypto_service.decrypt(encrypted)
    assert decrypted == sensitive_text


def test_backward_compatibility_with_plaintext():
    legacy_plaintext = (
        "This is an older journal entry created before "
        "field encryption was enabled."
    )

    # Should safely return legacy plaintext unchanged
    result = crypto_service.decrypt(legacy_plaintext)

    assert result == legacy_plaintext
    assert not crypto_service.is_encrypted(legacy_plaintext)


def test_tamper_resistance():
    sensitive_text = "Immutable journal record."

    encrypted = crypto_service.encrypt(sensitive_text)

    # Tamper with the ciphertext envelope
    tampered = encrypted[:-4] + "ABCD"

    with pytest.raises(ValueError):
        crypto_service.decrypt(tampered)


def test_journal_entry_storage_is_encrypted():
    user_id = "test-security-user-1"
    content = (
        "I had a great breakthrough on the "
        "machine learning project today!"
    )

    # Create journal via service
    entry = journal_service.create_journal(
        user_id=user_id,
        data=JournalCreate(
            content=content,
            source="text"
        )
    )

    # 1. Returned model to user should be decrypted
    assert entry.content == content

    # 2. Raw PostgreSQL repository storage must be encrypted
    raw_saved = journal_repo.get_by_id(
        user_id=user_id,
        journal_id=entry.id
    )

    assert raw_saved is not None
    assert raw_saved.content.startswith(ENCRYPTION_PREFIX)
    assert content not in raw_saved.content


def test_key_rotation_manager():
    key_v1 = "super-secret-key-generation-one-32bytes!"
    key_v2 = "super-secret-key-generation-two-32bytes!"

    secret_note = "Confidential business plans and strategy."

    # Encrypt with Key 1
    service_v1 = FieldEncryptionService(
        primary_key_str=key_v1
    )

    ciphertext_v1 = service_v1.encrypt(secret_note)

    assert service_v1.decrypt(ciphertext_v1) == secret_note

    # Rotate from Key 1 to Key 2
    rotator = KeyRotationManager(
        current_key=key_v1,
        new_key=key_v2
    )

    ciphertext_v2 = rotator.rotate_text(ciphertext_v1)

    # Verify rotated text decrypts with Key 2
    service_v2 = FieldEncryptionService(
        primary_key_str=key_v2
    )

    assert service_v2.decrypt(ciphertext_v2) == secret_note
    assert rotator.verify_rotation(
        secret_note,
        ciphertext_v2
    ) is True


def test_multi_key_fallback_decryption():
    key_old = "old-encryption-key-for-historical-records"
    key_new = "new-encryption-key-for-upcoming-records"

    old_service = FieldEncryptionService(
        primary_key_str=key_old
    )

    old_ciphertext = old_service.encrypt(
        "Historical journal note from 2025"
    )

    # New key is primary; old key is fallback
    modern_service = FieldEncryptionService(
        primary_key_str=key_new,
        old_keys_str=key_old
    )

    decrypted_old = modern_service.decrypt(
        old_ciphertext
    )

    assert decrypted_old == (
        "Historical journal note from 2025"
    )

    new_ciphertext = modern_service.encrypt(
        "Fresh journal note from 2026"
    )

    decrypted_new = modern_service.decrypt(
        new_ciphertext
    )

    assert decrypted_new == (
        "Fresh journal note from 2026"
    )


# ==========================================
# User Field-Level Encryption Service Tests
# ==========================================

def test_encryption_decryption_cycle():
    sample_text = (
        "Today I completed my DAA Assignment and "
        "built 3 pages of my React portfolio."
    )

    # 1. Encrypt text
    encrypted = encryption_service.encrypt_text(
        sample_text
    )

    assert encrypted != sample_text
    assert encrypted.startswith("enc_v1:")

    # 2. Decrypt text
    decrypted = encryption_service.decrypt_text(
        encrypted
    )

    assert decrypted == sample_text


def test_backward_compatibility_plaintext_fallback():
    plaintext_legacy = (
        "This is a legacy unencrypted journal entry."
    )

    # Plaintext without enc_v1 prefix should remain readable
    decrypted = encryption_service.decrypt_text(
        plaintext_legacy
    )

    assert decrypted == plaintext_legacy


def test_prepare_for_ai_processing():
    sample_text = (
        "I completed 2 modules of Data Structures."
    )

    encrypted = encryption_service.encrypt_text(
        sample_text
    )

    # AI processing helper should decrypt transiently
    ai_ready_text = (
        encryption_service.prepare_for_ai_processing(
            encrypted
        )
    )

    assert ai_ready_text == sample_text


def test_empty_string_handling():
    assert encryption_service.encrypt_text("") == ""
    assert encryption_service.decrypt_text("") == ""


# =========================================================================
# Aditya - Encryption Security Testing & Validation Suite (2 Sept 2026)
# =========================================================================

def test_weekly_summary_storage_is_encrypted_and_decrypted_on_read():
    """
    Verify sensitive Weekly Summary coaching suggestion
    is encrypted in PostgreSQL and transparently
    decrypted for the authorized user.
    """

    user_id = "test-sec-summary-user"

    mock_ai_summary = {
        "headline": "Great Progress on Cryptography",
        "wins": [
            "Completed AES-256-GCM integration"
        ],
        "recurring_blockers": [],
        "goal_status_changes": [],
        "mood_trend": "energized",
        "coaching_suggestion": (
            "Sensitive confidential coaching: "
            "Take mindful breaks between coding sprints."
        )
    }

    with patch(
        "app.services.gemini_service."
        "gemini_service.generate_weekly_summary",
        return_value=mock_ai_summary
    ):
        summary = summary_service.generate_weekly_summary(
            user_id=user_id,
            user_name="Aditya"
        )

        # 1. Returned model must contain plaintext
        assert summary.coaching_suggestion == (
            "Sensitive confidential coaching: "
            "Take mindful breaks between coding sprints."
        )

        # 2. Raw PostgreSQL storage must be encrypted
        raw_saved = summary_repo.get_latest_by_user(
            user_id
        )

        assert raw_saved is not None
        assert raw_saved.coaching_suggestion.startswith(
            ENCRYPTION_PREFIX
        )

        assert (
            "Sensitive confidential coaching"
            not in raw_saved.coaching_suggestion
        )

        # 3. Service read must decrypt it
        retrieved = summary_service.get_latest_summary(
            user_id
        )

        assert retrieved is not None

        assert retrieved.coaching_suggestion == (
            "Sensitive confidential coaching: "
            "Take mindful breaks between coding sprints."
        )


def test_cross_user_isolation_prevent_data_leakage():
    """
    Verify User A's encrypted journal cannot
    be accessed or decrypted by User B.
    """

    user_a = "user-alice-sec-1"
    user_b = "user-bob-sec-2"

    alice_secret = (
        "Alice confidential diary notes: "
        "Planning new patent submission."
    )

    mock_analysis = {
        "title": "Patent Planning",
        "mood": "focused",
        "activities": [],
        "goals": [],
        "blockers": [],
        "insights": [],
        "quick_summary": "Patent planning."
    }

    with patch(
        "app.services.gemini_service."
        "gemini_service.analyze_journal",
        return_value=mock_analysis
    ):
        entry_a = journal_service.create_journal(
            user_id=user_a,
            data=JournalCreate(
                content=alice_secret,
                source="text"
            )
        )

    # User B attempts to fetch Alice's journal
    bob_fetch = journal_service.get_journal(
        user_id=user_b,
        journal_id=entry_a.id
    )

    assert bob_fetch is None

    # User B lists all journals
    bob_list = journal_service.list_journals(
        user_id=user_b
    )

    assert not any(
        journal.id == entry_a.id
        for journal in bob_list
    )

    assert not any(
        alice_secret in journal.content
        for journal in bob_list
    )


def test_journal_full_crud_lifecycle_with_encryption():
    """
    Verify Journal Create, Read, Update and Delete
    operate correctly with field encryption.
    """

    user_id = "test-crud-sec-user"

    initial_text = (
        "Initial journal entry before update."
    )

    updated_text = (
        "Updated journal entry with newer insights."
    )

    mock_analysis = {
        "title": "CRUD Lifecycle",
        "mood": "productive",
        "activities": [],
        "goals": [],
        "blockers": [],
        "insights": [],
        "quick_summary": "CRUD test."
    }

    with patch(
        "app.services.gemini_service."
        "gemini_service.analyze_journal",
        return_value=mock_analysis
    ):

        # 1. Create
        created = journal_service.create_journal(
            user_id=user_id,
            data=JournalCreate(
                content=initial_text,
                source="text"
            )
        )

        assert created.content == initial_text

        # 2. Read
        fetched = journal_service.get_journal(
            user_id=user_id,
            journal_id=created.id
        )

        assert fetched is not None
        assert fetched.content == initial_text

        # 3. Update
        updated = journal_service.update_journal(
            user_id=user_id,
            journal_id=created.id,
            data=JournalUpdate(
                content=updated_text
            )
        )

        assert updated is not None
        assert updated.content == updated_text

        # Verify raw storage is encrypted
        raw = journal_repo.get_by_id(
            user_id=user_id,
            journal_id=created.id
        )

        assert raw is not None
        assert raw.content.startswith(
            ENCRYPTION_PREFIX
        )

        assert updated_text not in raw.content

        # 4. Delete
        delete_result = journal_service.delete_journal(
            user_id=user_id,
            journal_id=created.id
        )

        assert delete_result is True

        assert journal_service.get_journal(
            user_id=user_id,
            journal_id=created.id
        ) is None


def test_gemini_receives_decrypted_plaintext_internally():
    """
    Verify Gemini receives plaintext in RAM during
    journal analysis and weekly summary generation,
    never ciphertext.
    """

    user_id = "test-gemini-plaintext-user"

    plain_journal = (
        "Finished 5 chapters of Distributed Systems today."
    )

    # Capture journal content sent to Gemini
    captured_content = []

    def mock_analyze(content, existing_goals=None):
        captured_content.append(content)

        return {
            "title": "Study Systems",
            "mood": "satisfied",
            "activities": [],
            "goals": [],
            "blockers": [],
            "insights": [],
            "quick_summary": (
                "Studied distributed systems."
            )
        }

    with patch(
        "app.services.gemini_service."
        "gemini_service.analyze_journal",
        side_effect=mock_analyze
    ):
        journal_service.create_journal(
            user_id=user_id,
            data=JournalCreate(
                content=plain_journal,
                source="text"
            )
        )

    assert len(captured_content) == 1
    assert captured_content[0] == plain_journal

    assert not captured_content[0].startswith(
        ENCRYPTION_PREFIX
    )

    # Verify weekly summary also receives decrypted journals
    captured_summary_journals = []

    def mock_gen_summary(
        user_name,
        recent_journals,
        goals
    ):
        captured_summary_journals.extend(
            recent_journals
        )

        return {
            "headline": "Weekly Review",
            "wins": [],
            "recurring_blockers": [],
            "goal_status_changes": [],
            "mood_trend": "stable",
            "coaching_suggestion": (
                "Keep up the consistent studying."
            )
        }

    with patch(
        "app.services.gemini_service."
        "gemini_service.generate_weekly_summary",
        side_effect=mock_gen_summary
    ):
        summary_service.generate_weekly_summary(
            user_id=user_id,
            user_name="Aditya"
        )

    assert len(captured_summary_journals) >= 1

    matching_journals = [
        journal
        for journal in captured_summary_journals
        if journal["content"] == plain_journal
    ]

    assert len(matching_journals) >= 1

    assert not matching_journals[0]["content"].startswith(
        ENCRYPTION_PREFIX
    )


def test_incorrect_key_and_corrupted_payload_fail_safely():
    """
    Verify invalid or corrupted ciphertext fails
    safely with a clean ValueError exception.
    """

    service_a = FieldEncryptionService(
        primary_key_str=(
            "valid-secret-key-alpha-32bytes!!"
        )
    )

    service_b = FieldEncryptionService(
        primary_key_str=(
            "completely-different-key-beta-32!"
        )
    )

    ciphertext = service_a.encrypt(
        "Top secret strategy document."
    )

    # Decrypting with wrong key must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        service_b.decrypt(ciphertext)

    assert (
        "Decryption" in str(exc_info.value)
        or "corrupted" in str(exc_info.value)
    )


def test_legacy_unencrypted_records_seamless_coexistence():
    """
    Verify historical unencrypted plaintext records
    remain readable and can later be updated into
    encrypted format.
    """

    user_id = "legacy-user-101"

    legacy_text = (
        "Legacy unencrypted journal entry from August 2026."
    )

    # PostgreSQL generates the actual journal ID.
    legacy_entry = JournalEntry(
        id="legacy-journal-id-99",
        user_id=user_id,
        content=legacy_text,
        source="text",
        title="Historical Entry"
    )

    saved_legacy = journal_repo.create(
        legacy_entry
    )

    legacy_id = saved_legacy.id

    # 1. Legacy plaintext should remain readable
    retrieved = journal_service.get_journal(
        user_id=user_id,
        journal_id=legacy_id
    )

    assert retrieved is not None
    assert retrieved.content == legacy_text

    # 2. Updating the legacy entry should encrypt it
    updated = journal_service.update_journal(
        user_id=user_id,
        journal_id=legacy_id,
        data=JournalUpdate(
            content="Updated legacy note."
        )
    )

    assert updated is not None
    assert updated.content == "Updated legacy note."

    # 3. Verify new raw value is encrypted
    raw_stored = journal_repo.get_by_id(
        user_id=user_id,
        journal_id=legacy_id
    )

    assert raw_stored is not None

    assert raw_stored.content.startswith(
        ENCRYPTION_PREFIX
    )


def test_batch_key_rotation_migration_workflow():
    """
    Verify key-rotation migration workflow:

    1. Records encrypted under Key V1
    2. Rotated using KeyRotationManager to Key V2
    3. Old Key V1 can no longer decrypt rotated records
    """

    key_v1 = (
        "generation-one-secret-key-32bytes!"
    )

    key_v2 = (
        "generation-two-secret-key-32bytes!"
    )

    rotator = KeyRotationManager(
        current_key=key_v1,
        new_key=key_v2
    )

    service_v1 = FieldEncryptionService(
        primary_key_str=key_v1
    )

    service_v2 = FieldEncryptionService(
        primary_key_str=key_v2
    )

    original_records = [
        "Record 1: Weekly reflection on algorithms.",
        "Record 2: Quarterly goals and habit streak progress.",
        "Record 3: Mentorship notes and feedback."
    ]

    # Encrypt all records with V1
    encrypted_v1_records = [
        service_v1.encrypt(record)
        for record in original_records
    ]

    # Rotate all records to V2
    rotated_v2_records = [
        rotator.rotate_text(ciphertext)
        for ciphertext in encrypted_v1_records
    ]

    # Verify rotation
    for original, rotated_ciphertext in zip(
        original_records,
        rotated_v2_records
    ):

        assert rotated_ciphertext.startswith(
            ENCRYPTION_PREFIX
        )

        assert service_v2.decrypt(
            rotated_ciphertext
        ) == original

        # Old key should no longer decrypt rotated record
        with pytest.raises(ValueError):
            service_v1.decrypt(
                rotated_ciphertext
            )