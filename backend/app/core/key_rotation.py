import logging
from typing import Optional
from app.core.crypto import FieldEncryptionService, ENCRYPTION_PREFIX

logger = logging.getLogger(__name__)


class KeyRotationManager:
    """
    Manages encryption key rotation for field-level encrypted records.
    Provides batch re-encryption from an old key to a new primary key
    without service interruption.
    """

    def __init__(self, current_key: str, new_key: str):
        self.old_service = FieldEncryptionService(primary_key_str=current_key)
        self.new_service = FieldEncryptionService(primary_key_str=new_key)

    def rotate_text(self, ciphertext: Optional[str]) -> Optional[str]:
        """
        Decrypts using old key service and re-encrypts using new key service.
        If plaintext is unencrypted, encrypts with new key.
        """
        if ciphertext is None:
            return None

        # Decrypt with old service (handles both legacy plaintext and old ciphertext)
        plaintext = self.old_service.decrypt(ciphertext)
        # Re-encrypt with new service
        return self.new_service.encrypt(plaintext)

    def verify_rotation(self, original_plaintext: str, rotated_ciphertext: str) -> bool:
        """
        Verify that rotated ciphertext can be decrypted by the new key
        and yields identical plaintext.
        """
        decrypted = self.new_service.decrypt(rotated_ciphertext)
        return decrypted == original_plaintext
