import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.database.connection import Base
from app.database.orm_models import UserORM, JournalORM, AISummaryORM
from app.core.crypto import crypto_service, ENCRYPTION_PREFIX
from app.services.migration_service import DataEncryptionMigrator


@pytest.fixture
def test_db_session():
    """In-memory SQLite engine and session for migration testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Create dummy test user
    user = UserORM(
        firebase_uid="test_mig_user_123",
        email="mig_test@example.com",
        display_name="Migration Test User",
        created_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


def test_migration_dry_run_leaves_database_untouched(test_db_session):
    """Verify dry-run mode audits unencrypted records without persisting changes."""
    user = test_db_session.query(UserORM).first()
    plaintext_content = "Legacy unencrypted journal entry from 2025."

    journal = JournalORM(
        user_id=user.id,
        title="Old Reflection",
        content=plaintext_content,
        source="text",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(journal)
    test_db_session.commit()
    test_db_session.refresh(journal)

    # 1. Run in dry-run mode
    stats = DataEncryptionMigrator.migrate(db=test_db_session, dry_run=True)

    assert stats["dry_run"] is True
    assert stats["success"] is True
    assert stats["journals_scanned"] == 1
    assert stats["journals_migrated"] == 1
    assert stats["journals_already_encrypted"] == 0

    # 2. Verify record in database is STILL original plaintext
    reloaded = test_db_session.query(JournalORM).filter(JournalORM.id == journal.id).first()
    assert reloaded.content == plaintext_content
    assert not crypto_service.is_encrypted(reloaded.content)


def test_migration_live_encrypts_plaintext_records(test_db_session):
    """Verify live migration converts plaintext sensitive records into AES-256-GCM ciphertext."""
    user = test_db_session.query(UserORM).first()
    plain_journal_1 = "First confidential patient interaction reflection."
    plain_journal_2 = "Second reflection with strategic roadmap notes."
    plain_summary = "Weekly coaching note: maintain healthy sleep schedule."

    j1 = JournalORM(user_id=user.id, title="Entry 1", content=plain_journal_1, source="text")
    j2 = JournalORM(user_id=user.id, title="Entry 2", content=plain_journal_2, source="text")
    s1 = AISummaryORM(
        user_id=user.id,
        headline="Week 35 Review",
        wins=["Built MVP"],
        recurring_blockers=[],
        goal_status_changes=[],
        mood_trend="positive",
        coaching_suggestion=plain_summary,
    )
    test_db_session.add_all([j1, j2, s1])
    test_db_session.commit()

    # 1. Run live migration
    stats = DataEncryptionMigrator.migrate(db=test_db_session, dry_run=False)

    assert stats["dry_run"] is False
    assert stats["success"] is True
    assert stats["journals_migrated"] == 2
    assert stats["summaries_migrated"] == 1

    # 2. Verify storage has enc:v1: prefix
    reloaded_j1 = test_db_session.query(JournalORM).filter(JournalORM.id == j1.id).first()
    reloaded_j2 = test_db_session.query(JournalORM).filter(JournalORM.id == j2.id).first()
    reloaded_s1 = test_db_session.query(AISummaryORM).filter(AISummaryORM.id == s1.id).first()

    assert reloaded_j1.content.startswith(ENCRYPTION_PREFIX)
    assert reloaded_j2.content.startswith(ENCRYPTION_PREFIX)
    assert reloaded_s1.coaching_suggestion.startswith(ENCRYPTION_PREFIX)

    # 3. Verify plaintext is not leaked in raw storage
    assert plain_journal_1 not in reloaded_j1.content
    assert plain_journal_2 not in reloaded_j2.content
    assert plain_summary not in reloaded_s1.coaching_suggestion

    # 4. Verify decryption yields exact original plaintext
    assert crypto_service.decrypt(reloaded_j1.content) == plain_journal_1
    assert crypto_service.decrypt(reloaded_j2.content) == plain_journal_2
    assert crypto_service.decrypt(reloaded_s1.coaching_suggestion) == plain_summary


def test_migration_idempotency_prevents_double_encryption(test_db_session):
    """Verify running migration multiple times skips already encrypted records."""
    user = test_db_session.query(UserORM).first()
    plain_content = "Data to migrate idempotently."

    j = JournalORM(user_id=user.id, title="Idempotent Test", content=plain_content, source="text")
    test_db_session.add(j)
    test_db_session.commit()

    # First pass
    stats1 = DataEncryptionMigrator.migrate(db=test_db_session, dry_run=False)
    assert stats1["journals_migrated"] == 1
    first_pass_content = test_db_session.query(JournalORM).filter(JournalORM.id == j.id).first().content
    assert first_pass_content.startswith(ENCRYPTION_PREFIX)

    # Second pass
    stats2 = DataEncryptionMigrator.migrate(db=test_db_session, dry_run=False)
    assert stats2["journals_migrated"] == 0
    assert stats2["journals_already_encrypted"] == 1

    second_pass_content = test_db_session.query(JournalORM).filter(JournalORM.id == j.id).first().content
    # Content must NOT be altered or double-encrypted
    assert second_pass_content == first_pass_content
    assert not second_pass_content.startswith(f"{ENCRYPTION_PREFIX}{ENCRYPTION_PREFIX}")
    assert crypto_service.decrypt(second_pass_content) == plain_content
