import os
import tempfile
import logging
import threading
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class WhisperService:
    _instance: Optional["WhisperService"] = None
    _lock = threading.Lock()

    def __init__(self):
        self._model = None
        self._init_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "WhisperService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if self._model is None:
            with self._init_lock:
                if self._model is None:
                    from faster_whisper import WhisperModel
                    logger.info(
                        "Lazy-loading faster-whisper model: %s on %s with %s",
                        settings.WHISPER_MODEL,
                        settings.WHISPER_DEVICE,
                        settings.WHISPER_COMPUTE_TYPE,
                    )
                    self._model = WhisperModel(
                        model_size_or_path=settings.WHISPER_MODEL,
                        device=settings.WHISPER_DEVICE,
                        compute_type=settings.WHISPER_COMPUTE_TYPE,
                    )
                    logger.info("faster-whisper Tiny model loaded successfully.")

    def transcribe_audio_bytes(
        self, audio_bytes: bytes, original_filename: str = "audio.webm"
    ) -> Tuple[str, float, str]:
        """
        Safely transcribes raw audio bytes using the local faster-whisper Tiny model.
        Writes to a temporary file, transcribes, and guarantees immediate deletion.
        """
        if not audio_bytes:
            return "", 0.0, "en"

        self._load_model()

        # Determine file extension
        suffix = ".webm"
        if "." in original_filename:
            suffix = "." + original_filename.rsplit(".", 1)[1].lower()

        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_file_path = temp_audio.name

            # Transcribe with faster-whisper
            segments, info = self._model.transcribe(
                temp_file_path,
                beam_size=1,  # Fast greedy decoding for low memory/CPU
                language="en",
                vad_filter=True,  # Filter out silence
            )

            text_segments = []
            for segment in segments:
                text_segments.append(segment.text.strip())

            full_transcript = " ".join(text_segments).strip()
            duration = float(info.duration) if hasattr(info, "duration") else 0.0
            language = str(info.language) if hasattr(info, "language") else "en"

            return full_transcript, duration, language

        except Exception as e:
            logger.error("Error during faster-whisper transcription: %s", e)
            raise e
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as cleanup_err:
                    logger.warning("Could not delete temporary audio file %s: %s", temp_file_path, cleanup_err)

whisper_service = WhisperService.get_instance()
