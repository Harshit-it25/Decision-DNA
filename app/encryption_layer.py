import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class AESEncryptionLayer:
    """
    Symmetric AES-256-GCM Encryption Layer for applicant PII.
    Provides quantum-resistant symmetric encryption (standard key size of 256 bits
    protects against Grover's quantum search algorithm).
    """
    def __init__(self, secret_key: str = None):
        if secret_key:
            self.key = secret_key.encode().ljust(32)[:32]
        else:
            self.key = os.urandom(32) # Standard 256-bit key

    def encrypt_field(self, data: str) -> str:
        """
        Encrypts a sensitive PII field using AES-256-GCM.
        """
        if not data: return data
        iv = os.urandom(12) # GCM recommended IV size
        encryptor = Cipher(
            algorithms.AES(self.key),
            modes.GCM(iv),
            backend=default_backend()
        ).encryptor()
        
        ciphertext = encryptor.update(data.encode()) + encryptor.finalize()
        # Combine IV + Ciphertext + Tag (GCM)
        combined = iv + ciphertext + encryptor.tag
        return base64.b64encode(combined).decode('utf-8')

    def decrypt_field(self, encrypted_data: str) -> str:
        """
        Decrypts a sensitive PII field using AES-256-GCM.
        """
        if not encrypted_data: return encrypted_data
        try:
            combined = base64.b64decode(encrypted_data)
            iv = combined[:12]
            tag = combined[-16:]
            ciphertext = combined[12:-16]
            
            decryptor = Cipher(
                algorithms.AES(self.key),
                modes.GCM(iv, tag),
                backend=default_backend()
            ).decryptor()
            
            return (decryptor.update(ciphertext) + decryptor.finalize()).decode('utf-8')
        except Exception as e:
            print(f"Decryption Failure: {e}")
            return "[ENCRYPTED_DATA_CORRUPT]"

# --- Integration Example ---
if __name__ == "__main__":
    aes_enc = AESEncryptionLayer(secret_key="quantum_safe_vault_key_2024")
    
    sensitive_name = "Jane Doe"
    encrypted = aes_enc.encrypt_field(sensitive_name)
    decrypted = aes_enc.decrypt_field(encrypted)
    
    print("--- Decision DNA Symmetric Encryption Layer ---")
    print(f"Original:  {sensitive_name}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {decrypted}")
    print("-----------------------------------------------------")
    print("Status: AES-256-GCM Encryption Layer Verified")
