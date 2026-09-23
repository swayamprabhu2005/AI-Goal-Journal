"""
app/services/gemini_service.py

Adds validation on top of the extraction call.

Handling invalid/incomplete AI responses — approach used here, based on
what's standard practice for structured LLM extraction (see notes at
bottom of this file):

1. Ask for JSON mode (response_mime_type="application/json") — cuts
   down on the model wrapping output in markdown fences or prose.
2. Parse with json.loads(). If that fails, it's a malformed-JSON error.
3. Validate the parsed dict against the Pydantic schema
   (ExtractionResult). If a field is missing, has the wrong type, or a
   goal has a status outside the allowed enum, Pydantic raises
   ValidationError.
4. On EITHER failure, retry once with a "repair" prompt: send the
   model's bad output back to it along with the validation error and
   ask it to fix it. One retry catches the vast majority of formatting
   slips without burning excessive quota.
5. If the repair attempt also fails, raise GeminiExtractionError with
   the original entry text and the last error, so the caller (route
   handler) can decide what to do — e.g. store the entry as
   "needs_review" instead of silently dropping it or crashing.

We deliberately do NOT try to auto-fix content-level problems (e.g. a
hallucinated goal) — only structural/schema problems. Content quality is
a prompt-engineering problem, not a validation problem.
"""

import json

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL_NAME,
    EXTRACTION_TEMPERATURE,
    MAX_REPAIR_ATTEMPTS,
)
from app.prompts.journal_extraction import SYSTEM_INSTRUCTION, build_extraction_prompt
from app.schemas.extraction import ExtractionResult


class GeminiExtractionError(Exception):
    """
    Raised when Gemini's response cannot be turned into a valid
    ExtractionResult, even after repair attempts.
    """

    def __init__(self, message: str, raw_response: str | None = None):
        super().__init__(message)
        self.raw_response = raw_response


REPAIR_PROMPT_TEMPLATE = """\
Your previous response could not be parsed/validated. Fix it and return
ONLY the corrected JSON object — no markdown fences, no commentary.

REQUIRED SCHEMA:
{schema}

YOUR PREVIOUS (INVALID) RESPONSE:
{previous_response}

VALIDATION ERROR:
{error}
"""


class GeminiService:
    def __init__(self, model_name: str = GEMINI_MODEL_NAME):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model_name = model_name

    def _call_gemini(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=EXTRACTION_TEMPERATURE,
                response_mime_type="application/json",
            ),
        )
        return response.text

    def _parse_and_validate(self, raw_text: str) -> ExtractionResult:
        """Raises json.JSONDecodeError or pydantic.ValidationError on failure."""
        parsed = json.loads(raw_text)
        return ExtractionResult.model_validate(parsed)

    def extract_from_journal(
        self,
        entry_text: str,
        existing_goals: list[str] | None = None,
    ) -> ExtractionResult:
        """
        Send one journal entry to Gemini and return a validated
        ExtractionResult. Retries once with a repair prompt if the
        first response is malformed or fails schema validation.
        """
        prompt = build_extraction_prompt(entry_text, existing_goals)
        raw_text = self._call_gemini(prompt)

        last_error: Exception | None = None
        for attempt in range(MAX_REPAIR_ATTEMPTS + 1):
            try:
                return self._parse_and_validate(raw_text)
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                if attempt >= MAX_REPAIR_ATTEMPTS:
                    break
                repair_prompt = REPAIR_PROMPT_TEMPLATE.format(
                    schema=ExtractionResult.model_json_schema(),
                    previous_response=raw_text,
                    error=str(exc),
                )
                raw_text = self._call_gemini(repair_prompt)

        raise GeminiExtractionError(
            f"Gemini response failed validation after "
            f"{MAX_REPAIR_ATTEMPTS + 1} attempt(s): {last_error}",
            raw_response=raw_text,
        ) from last_error
