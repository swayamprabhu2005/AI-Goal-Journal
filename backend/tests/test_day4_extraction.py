"""
tests/test_day4_extraction.py

Run: py -m tests.test_day4_extraction   (from the backend/ folder)
"""

from app.services.gemini_service import GeminiService, GeminiExtractionError
from tests.day4_samples import DAY4_SAMPLES


def main():
    service = GeminiService()

    for sample in DAY4_SAMPLES:
        print("=" * 70)
        print(sample["label"])
        print("-" * 70)
        print(f"Entry: {sample['text']}")
        if sample["existing_goals"]:
            print(f"Existing goals: {sample['existing_goals']}")
        print()

        try:
            result = service.extract_from_journal(
                entry_text=sample["text"],
                existing_goals=sample["existing_goals"],
            )
            print(result.model_dump_json(indent=2))
        except GeminiExtractionError as exc:
            print(f"[VALIDATION FAILED] {exc}")
            print(f"Raw response was: {exc.raw_response}")
        except Exception as exc:
            print(f"[API ERROR] {exc}")

        print()


if __name__ == "__main__":
    main()