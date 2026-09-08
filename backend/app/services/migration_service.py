import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.crypto import crypto_service
from app.database.connection import SessionLocal
from app.database.orm_models import JournalORM, AISummaryORM

logger = logging.getLogger(__name__)


class DataEncryptionMigrator:
    """
    Safely migrates existing plaintext sensitive database records into AES-256-GCM
    field-encrypted ciphertext with the 'enc:v1:' prefix.

    Guarantees:
    - Idempotency: Already-encrypted records are skipped; never double-encrypted.
    - Dry-Run Support: Allows auditing legacy records without writing to the database.
    - Transaction Safety: Atomic commits with automatic rollback on error.
    - Backward Compatibility: Decryption transparently verifies record integrity.
    """

    @classmethod
    def migrate(
        cls,
        db: Optional[Session] = None,
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """
        Scan and migrate all unencrypted sensitive records in the database.
        
        Args:
            db: Optional SQLAlchemy Session. If None, creates a new SessionLocal.
            dry_run: If True, detects and calculates records to migrate without saving changes.

        Returns:
            Dictionary detailing scanned, migrated, already_encrypted, and error counts.
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        stats = {
            "dry_run": dry_run,
            "journals_scanned": 0,
            "journals_migrated": 0,
            "journals_already_encrypted": 0,
            "summaries_scanned": 0,
            "summaries_migrated": 0,
            "summaries_already_encrypted": 0,
            "errors": [],
            "success": False,
        }

        try:
            # -----------------------------------------------------------------
            # 1. Migrate Journal Entries (content field)
            # -----------------------------------------------------------------
            journals = db.query(JournalORM).all()
            stats["journals_scanned"] = len(journals)

            for journal in journals:
                content = journal.content
                if not content:
                    continue

                if crypto_service.is_encrypted(content):
                    stats["journals_already_encrypted"] += 1
                else:
                    # Unencrypted legacy record detected
                    encrypted_content = crypto_service.encrypt(content)
                    if not dry_run:
                        journal.content = encrypted_content
                    stats["journals_migrated"] += 1
                    logger.debug("Migrated journal entry ID %s", journal.id)

            # -----------------------------------------------------------------
            # 2. Migrate AI Weekly Summaries (coaching_suggestion field)
            # -----------------------------------------------------------------
            summaries = db.query(AISummaryORM).all()
            stats["summaries_scanned"] = len(summaries)

            for summary in summaries:
                suggestion = summary.coaching_suggestion
                if not suggestion:
                    continue

                if crypto_service.is_encrypted(suggestion):
                    stats["summaries_already_encrypted"] += 1
                else:
                    # Unencrypted legacy record detected
                    encrypted_suggestion = crypto_service.encrypt(suggestion)
                    if not dry_run:
                        summary.coaching_suggestion = encrypted_suggestion
                    stats["summaries_migrated"] += 1
                    logger.debug("Migrated AI summary ID %s", summary.id)

            # -----------------------------------------------------------------
            # 3. Commit or Rollback
            # -----------------------------------------------------------------
            if not dry_run:
                db.commit()
                logger.info(
                    "Encryption migration committed successfully: "
                    "%d journals, %d summaries migrated.",
                    stats["journals_migrated"],
                    stats["summaries_migrated"],
                )
            else:
                db.rollback()
                logger.info(
                    "Encryption migration DRY-RUN complete: "
                    "%d journals, %d summaries would be migrated.",
                    stats["journals_migrated"],
                    stats["summaries_migrated"],
                )

            stats["success"] = True
            return stats

        except Exception as exc:
            db.rollback()
            logger.error("Encryption migration failed, transaction rolled back: %s", exc)
            stats["errors"].append(str(exc))
            stats["success"] = False
            return stats

        finally:
            if should_close:
                db.close()


migration_service = DataEncryptionMigrator()
