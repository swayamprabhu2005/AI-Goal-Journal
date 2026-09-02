import base64
import hashlib
import logging
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

logger = logging.getLogger(__name__)

ENCRYPTION_PREFIX = "enc:v1:"


def _derive_key(key_input: str) -> bytes:
    """
    Derive a 32-byte (256-bit) binary key from a hex string, base64 string,
    or arbitrary passphrase using SHA-256.
    """
    if not key_input:
        # Fallback deterministic key for dev/local testing if not provided in env
        key_input = "ai-goal-journal-default-secret-dev-key-change-in-prod"

    key_bytes = key_input.strip().encode("utf-8")

    # If it's a 64-char hex string, decode it
    if len(key_bytes) == 64:
        try:
            return bytes.fromhex(key_input.strip())
        except ValueError:
            pass

    # If it's 44-char base64, try decoding
    if len(key_bytes) == 44:
        try:
            decoded = base64.b64decode(key_bytes)
            if len(decoded) == 32:
                return decoded
        except Exception:
            pass

    # Otherwise derive 32-byte key using SHA-256 hash
    return hashlib.sha256(key_bytes).digest()


class FieldEncryptionService:
    """
    Field-level encryption using AES-256-GCM.
    Ensures confidentiality and integrity for sensitive user content
    such as journal entries and AI weekly summaries.
    """

    def __init__(self, primary_key_str: Optional[str] = None, old_keys_str: Optional[str] = None):
        self._primary_key = _derive_key(primary_key_str or settings.ENCRYPTION_KEY)
        self._aesgcm = AESGCM(self._primary_key)

        # Parse old keys for rotation support
        old_keys_raw = (old_keys_str or settings.ENCRYPTION_OLD_KEYS or "").split(",")
        self._fallback_keys: list[bytes] = [
            _derive_key(k) for k in old_keys_raw if k.strip()
        ]

    def encrypt(self, plaintext: Optional[str]) -> Optional[str]:
        """
        Encrypts a UTF-8 plaintext string using AES-256-GCM.
        Returns serialized envelope: 'enc:v1:<base64(12-byte-nonce + ciphertext-with-tag)>'
        Returns None if plaintext is None.
        If already encrypted, returns as-is to prevent double-encryption.
        """
        if plaintext is None:
            return None

        if not isinstance(plaintext, str):
            plaintext = str(plaintext)

        if plaintext.startswith(ENCRYPTION_PREFIX):
            return plaintext

        # 12-byte unique initialization vector (nonce) for GCM mode
        nonce = os.urandom(12)
        plaintext_bytes = plaintext.encode("utf-8")
        ciphertext_with_tag = self._aesgcm.encrypt(nonce, plaintext_bytes, None)

        combined = nonce + ciphertext_with_tag
        encoded = base64.b64encode(combined).decode("ascii")
        return f"{ENCRYPTION_PREFIX}{encoded}"

    def decrypt(self, ciphertext: Optional[str]) -> Optional[str]:
        """
        Decrypts an AES-256-GCM envelope.
        Transparent backward compatibility: If ciphertext does NOT start
        with 'enc:v1:', it is treated as existing plaintext and returned unchanged.
        """
        if ciphertext is None:
            return None

        if not isinstance(ciphertext, str):
            ciphertext = str(ciphertext)

        # Backward compatibility: legacy plaintext is returned directly
        if not ciphertext.startswith(ENCRYPTION_PREFIX):
            return ciphertext

        payload_b64 = ciphertext[len(ENCRYPTION_PREFIX):]
        try:
            raw = base64.b64decode(payload_b64)
            if len(raw) < 28:  # 12-byte nonce + min 16-byte GCM tag
                raise ValueError("Payload too short to be valid AES-GCM ciphertext")

            nonce = raw[:12]
            ct = raw[12:]

            # Try primary key first
            try:
                decrypted_bytes = self._aesgcm.decrypt(nonce, ct, None)
                return decrypted_bytes.decode("utf-8")
            except Exception as primary_err:
                # If primary key fails, try old rotation keys
                for old_key in self._fallback_keys:
                    try:
                        old_aes = AESGCM(old_key)
                        decrypted_bytes = old_aes.decrypt(nonce, ct, None)
                        return decrypted_bytes.decode("utf-8")
                    except Exception:
                        continue
                logger.error("Failed to decrypt ciphertext with primary and fallback keys: %s", primary_err)
                raise ValueError("Decryption failed: corrupted data or invalid encryption key") from primary_err

        except Exception as e:
            logger.error("Decryption error: %s", e)
            raise ValueError(f"Decryption error: {e}") from e

    def is_encrypted(self, val: Optional[str]) -> bool:
        """Check if a string has been encrypted with the envelope prefix."""
        return isinstance(val, str) and val.startswith(ENCRYPTION_PREFIX)


# Global singleton encryption service
crypto_service = FieldEncryptionService()
