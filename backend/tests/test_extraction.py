"""
test_extraction.py

Day 3 deliverable: run the extraction prompt against 3-5 sample journal
entries and print the results, so we can eyeball whether the extraction
logic (goals / activities / blockers / mood) is behaving as designed.

Run:
    python test_extraction.py
"""

import json

from app.services.gemini_service import GeminiService, GeminiExtractionError
from .sample_journals import SAMPLE_ENTRIES


def main():
    service = GeminiService()

    for sample in SAMPLE_ENTRIES:
        print("=" * 70)
        print(sample["label"])
        print("-" * 70)
        print(f"Entry: {sample['text']}")
        if sample["existing_goals"]:
            print(f"Existing goals given as context: {sample['existing_goals']}")
        print()

        try:
            result = service.extract_from_journal(
                entry_text=sample["text"],
                existing_goals=sample["existing_goals"],
            )
            print(json.dumps(result, indent=2))
        except GeminiExtractionError as exc:
            print(f"[EXTRACTION ERROR] {exc}")
        except Exception as exc:  # covers auth/quota/network errors from the API
            print(f"[API ERROR] {exc}")

        print()


if __name__ == "__main__":
    main()