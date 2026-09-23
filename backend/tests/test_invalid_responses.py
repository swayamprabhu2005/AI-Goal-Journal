"""
tests/test_invalid_responses.py

Tests the schema validation and repair-retry logic WITHOUT calling the
real Gemini API — mocks GeminiService._call_gemini so we can feed it
deliberately broken responses and confirm the handling works.

Run: py -m tests.test_invalid_responses   (from the backend/ folder)
"""

from unittest.mock import patch

from app.services.gemini_service import GeminiService, GeminiExtractionError
from app.schemas.extraction import ExtractionResult


VALID_JSON = """{
  "goals": [{"title": "Learn FastAPI", "status": "Active"}],
  "completed_activities": ["Completed React assignment"],
  "blockers": []
}"""

# Missing required key ("blockers")
INCOMPLETE_JSON = """{
  "goals": [{"title": "Learn FastAPI", "status": "Active"}],
  "completed_activities": ["Completed React assignment"]
}"""

# Not valid JSON at all (model added prose around it)
MALFORMED_JSON = """Sure, here's the extraction:
{
  "goals": [], "completed_activities": [], "blockers": []
}"""

# Valid JSON but invalid enum value for status
INVALID_ENUM_JSON = """{
  "goals": [{"title": "Learn FastAPI", "status": "Kinda Active I Guess"}],
  "completed_activities": [],
  "blockers": []
}"""


def test_valid_response_passes():
    service = GeminiService.__new__(GeminiService)  # skip __init__ (no real client needed)
    with patch.object(service, "_call_gemini", return_value=VALID_JSON):
        result = service.extract_from_journal("some entry")
    assert isinstance(result, ExtractionResult)
    assert result.goals[0].title == "Learn FastAPI"
    print("PASS: valid response accepted")


def test_incomplete_json_triggers_repair_then_fails():
    service = GeminiService.__new__(GeminiService)
    # first call returns incomplete JSON, repair call also returns incomplete JSON
    with patch.object(service, "_call_gemini", side_effect=[INCOMPLETE_JSON, INCOMPLETE_JSON]):
        try:
            service.extract_from_journal("some entry")
            raise AssertionError("expected GeminiExtractionError")
        except GeminiExtractionError as exc:
            assert exc.raw_response == INCOMPLETE_JSON
    print("PASS: incomplete JSON retried once, then raised GeminiExtractionError")


def test_incomplete_json_repaired_on_retry():
    service = GeminiService.__new__(GeminiService)
    # first call returns incomplete JSON, repair call returns a VALID response
    with patch.object(service, "_call_gemini", side_effect=[INCOMPLETE_JSON, VALID_JSON]):
        result = service.extract_from_journal("some entry")
    assert isinstance(result, ExtractionResult)
    print("PASS: incomplete JSON successfully repaired on retry")


def test_malformed_json_raises_after_retry():
    service = GeminiService.__new__(GeminiService)
    with patch.object(service, "_call_gemini", side_effect=[MALFORMED_JSON, MALFORMED_JSON]):
        try:
            service.extract_from_journal("some entry")
            raise AssertionError("expected GeminiExtractionError")
        except GeminiExtractionError:
            pass
    print("PASS: malformed (non-JSON) response handled")


def test_invalid_enum_value_rejected():
    service = GeminiService.__new__(GeminiService)
    with patch.object(service, "_call_gemini", side_effect=[INVALID_ENUM_JSON, INVALID_ENUM_JSON]):
        try:
            service.extract_from_journal("some entry")
            raise AssertionError("expected GeminiExtractionError")
        except GeminiExtractionError:
            pass
    print("PASS: invalid status enum value rejected by schema")


if __name__ == "__main__":
    test_valid_response_passes()
    test_incomplete_json_triggers_repair_then_fails()
    test_incomplete_json_repaired_on_retry()
    test_malformed_json_raises_after_retry()
    test_invalid_enum_value_rejected()
    print("\nAll invalid-response handling tests passed.")
