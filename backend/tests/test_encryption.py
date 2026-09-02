import pytest
from app.core.crypto import FieldEncryptionService, crypto_service, ENCRYPTION_PREFIX
from app.core.key_rotation import KeyRotationManager
from app.services.journal_service import journal_service
from app.schemas.journal import JournalCreate
from app.repositories.in_memory import journal_repo


def test_field_encryption_and_decryption_roundtrip():
    sensitive_text = "Private confidential reflection: I struggled with imposter syndrome today."
    
    # Encrypt
    encrypted = crypto_service.encrypt(sensitive_text)
    assert encrypted.startswith(ENCRYPTION_PREFIX)
    assert sensitive_text not in encrypted  # Ciphertext must not reveal plaintext
    
    # Decrypt
    decrypted = crypto_service.decrypt(encrypted)
    assert decrypted == sensitive_text


def test_backward_compatibility_with_plaintext():
    legacy_plaintext = "This is an older journal entry created before field encryption was enabled."
    
    # Should safely return legacy plaintext unchanged without raising an exception
    result = crypto_service.decrypt(legacy_plaintext)
    assert result == legacy_plaintext
    assert not crypto_service.is_encrypted(legacy_plaintext)


def test_tamper_resistance():
    sensitive_text = "Immutable journal record."
    encrypted = crypto_service.encrypt(sensitive_text)
    
    # Tamper with the ciphertext envelope
    tampered = encrypted[:-4] + "ABCD"
    with pytest.raises(ValueError):
        crypto_service.decrypt(tampered)


def test_journal_entry_storage_is_encrypted():
    user_id = "test-security-user-1"
    content = "I had a great breakthrough on the machine learning project today!"
    
    # Create journal via service
    entry = journal_service.create_journal(
        user_id=user_id,
        data=JournalCreate(content=content, source="text")
    )
    
    # 1. Returned model to user should be decrypted
    assert entry.content == content
    
    # 2. Raw repository storage MUST be encrypted with enc:v1:
    raw_saved = journal_repo.get_by_id(user_id=user_id, journal_id=entry.id)
    assert raw_saved is not None
    assert raw_saved.content.startswith(ENCRYPTION_PREFIX)
    assert content not in raw_saved.content


def test_key_rotation_manager():
    key_v1 = "super-secret-key-generation-one-32bytes!"
    key_v2 = "super-secret-key-generation-two-32bytes!"
    
    secret_note = "Confidential business plans and strategy."
    
    # Encrypt with Key 1
    service_v1 = FieldEncryptionService(primary_key_str=key_v1)
    ciphertext_v1 = service_v1.encrypt(secret_note)
    assert service_v1.decrypt(ciphertext_v1) == secret_note
    
    # Rotate from Key 1 to Key 2
    rotator = KeyRotationManager(current_key=key_v1, new_key=key_v2)
    ciphertext_v2 = rotator.rotate_text(ciphertext_v1)
    
    # Verify rotated text decrypts with Key 2
    service_v2 = FieldEncryptionService(primary_key_str=key_v2)
    assert service_v2.decrypt(ciphertext_v2) == secret_note
    assert rotator.verify_rotation(secret_note, ciphertext_v2) is True


def test_multi_key_fallback_decryption():
    key_old = "old-encryption-key-for-historical-records"
    key_new = "new-encryption-key-for-upcoming-records"
    
    old_service = FieldEncryptionService(primary_key_str=key_old)
    old_ciphertext = old_service.encrypt("Historical journal note from 2025")
    
    # Service with key_new as primary and key_old as fallback in old_keys_str
    modern_service = FieldEncryptionService(primary_key_str=key_new, old_keys_str=key_old)
    
    # Modern service should decrypt both old records and new records seamlessly
    decrypted_old = modern_service.decrypt(old_ciphertext)
    assert decrypted_old == "Historical journal note from 2025"
    
    new_ciphertext = modern_service.encrypt("Fresh journal note from 2026")
    decrypted_new = modern_service.decrypt(new_ciphertext)
    assert decrypted_new == "Fresh journal note from 2026"
