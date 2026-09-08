#!/usr/bin/env python3
"""
migrate_existing_data.py

Operational migration script for Swayam's task:
Batch-encrypts existing plaintext sensitive records (journals and AI coaching summaries)
into AES-256-GCM authenticated envelopes with 'enc:v1:' prefix.

Usage:
    python backend/scripts/migrate_existing_data.py [--dry-run] [--verbose]
"""

import argparse
import sys
import logging
from pathlib import Path

# Add backend directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.migration_service import migration_service
from app.database.connection import SessionLocal


def main():
    parser = argparse.ArgumentParser(
        description="Migrate legacy plaintext sensitive database records to AES-256-GCM encryption."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate the migration without writing any changes to the database.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable detailed debug logging output.",
    )

    args = parser.parse_args()

    logging_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=logging_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    print("=" * 70)
    print("      AI GOAL JOURNAL — DATA ENCRYPTION MIGRATION TOOL")
    print("=" * 70)
    if args.dry_run:
        print("MODE: DRY-RUN (Read-Only simulation, NO database modifications will be committed)")
    else:
        print("MODE: LIVE MIGRATION (Changes will be committed to the database)")
    print("Target Fields:")
    print("  - journals.content               -> AES-256-GCM ('enc:v1:')")
    print("  - ai_summaries.coaching_suggestion -> AES-256-GCM ('enc:v1:')")
    print("-" * 70)

    db = SessionLocal()
    try:
        results = migration_service.migrate(db=db, dry_run=args.dry_run)

        print("\nMIGRATION SUMMARY RESULTS:")
        print(f"  • Journals Scanned:           {results['journals_scanned']}")
        print(f"  • Journals Migrated:          {results['journals_migrated']}")
        print(f"  • Journals Already Encrypted: {results['journals_already_encrypted']}")
        print(f"  • Summaries Scanned:          {results['summaries_scanned']}")
        print(f"  • Summaries Migrated:         {results['summaries_migrated']}")
        print(f"  • Summaries Already Encrypted:{results['summaries_already_encrypted']}")
        print(f"  • Dry-Run Mode:               {results['dry_run']}")
        print(f"  • Status:                     {'SUCCESS' if results['success'] else 'FAILED'}")

        if results["errors"]:
            print("\nERRORS ENCOUNTERED:")
            for err in results["errors"]:
                print(f"  ! {err}")
            sys.exit(1)

        print("-" * 70)
        if args.dry_run:
            print("Dry-run complete. Run without --dry-run to commit changes.")
        else:
            print("Migration completed and committed successfully.")
        print("=" * 70)

    except Exception as exc:
        print(f"\nFATAL MIGRATION ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
