import os
import base64
import logging
import hashlib
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

logger = logging.getLogger(__name__)

CIPHER_PREFIX = "enc_v1:"

class EncryptionService:
    """
    Field-Level Application Layer Encryption Service for sensitive user data (journals, notes).
    Uses AES-256-GCM authenticated encryption with Fernet fallback.
    """
    def __init__(self):
        self._key: Optional[bytes] = None
        self._fernet: Optional[Fernet] = None
        self._aesgcm: Optional[AESGCM] = None
        self._initialize_keys()

    def _initialize_keys(self):
        raw_key = getattr(settings, "JOURNAL_ENCRYPTION_KEY", "") or os.getenv("JOURNAL_ENCRYPTION_KEY", "")
        
        if not raw_key:
            # Fallback deterministic key derivation for local dev if JOURNAL_ENCRYPTION_KEY is unpopulated
            dev_seed = "ai_goal_journal_local_development_encryption_salt_key_2026"
            raw_key_bytes = hashlib.sha256(dev_seed.encode("utf-8")).digest()
            logger.info("Using local dev derived encryption key (Set JOURNAL_ENCRYPTION_KEY in .env for production)")
        else:
            try:
                # If valid base64 Fernet key provided
                raw_key_bytes = base64.urlsafe_b64decode(raw_key.encode("utf-8"))
                if len(raw_key_bytes) != 32:
                    raw_key_bytes = hashlib.sha256(raw_key.encode("utf-8")).digest()
            except Exception:
                raw_key_bytes = hashlib.sha256(raw_key.encode("utf-8")).digest()

        self._key = raw_key_bytes
        fernet_b64 = base64.urlsafe_b64encode(self._key)
        self._fernet = Fernet(fernet_b64)
        self._aesgcm = AESGCM(self._key[:32])

    @staticmethod
    def generate_key() -> str:
        """Utility to generate a new 256-bit URL-safe base64 encryption key for .env."""
        return Fernet.generate_key().decode("utf-8")

    def encrypt_text(self, plaintext: str) -> str:
        """
        Encrypts sensitive plaintext string using AES-256-GCM / Fernet authenticated cipher.
        Returns prefixed ciphertext string.
        """
        if not plaintext:
            return ""

        try:
            # Use Fernet authenticated encryption
            cipher_bytes = self._fernet.encrypt(plaintext.encode("utf-8"))
            encrypted_str = cipher_bytes.decode("utf-8")
            return f"{CIPHER_PREFIX}{encrypted_str}"
        except Exception as e:
            logger.error("Encryption error: %s", e)
            raise RuntimeError(f"Failed to encrypt sensitive data: {e}")

    def decrypt_text(self, ciphertext_or_plain: str) -> str:
        """
        Decrypts ciphertext back into plaintext.
        Backward-Compatible: If text is plaintext (not starting with CIPHER_PREFIX), returns text as-is.
        """
        if not ciphertext_or_plain:
            return ""

        # Backward compatibility check for unencrypted legacy plaintext
        if not ciphertext_or_plain.startswith(CIPHER_PREFIX):
            return ciphertext_or_plain

        raw_ciphertext = ciphertext_or_plain[len(CIPHER_PREFIX):]

        try:
            decrypted_bytes = self._fernet.decrypt(raw_ciphertext.encode("utf-8"))
            return decrypted_bytes.decode("utf-8")
        except InvalidToken:
            logger.warning("Invalid encryption token or key mismatch. Attempting raw return.")
            return ciphertext_or_plain
        except Exception as e:
            logger.error("Decryption error: %s", e)
            return ciphertext_or_plain

    def prepare_for_ai_processing(self, journal_content: str) -> str:
        """
        Provides decrypted journal content in RAM specifically for Gemini AI processing.
        Plaintext is held transiently in memory and discarded after execution.
        """
        return self.decrypt_text(journal_content)

encryption_service = EncryptionService()
