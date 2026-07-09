"""
Cryptographic Utilities — AES-256-GCM Post-Quantum Classical Encryption
========================================================================
Provides symmetric encryption/decryption for logistics payloads using
the Conference Key derived from the quantum network simulation.

The quantum-generated conference key is used as the AES-256-GCM key,
ensuring that only the parties who participated in the multi-party
entanglement can decrypt the shared logistics manifest.

Author: Prem | Quant-A-Thon'26
"""

import os
import json
import base64
from datetime import datetime, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


# ─── Sample Logistics Manifest ─────────────────────────────────────────────

LOGISTICS_MANIFEST = {
    "manifest_id": "MAQAN-QKD-2026-07-001",
    "version": "1.0.0",
    "classification": "QUANTUM-SECURED | CONFERENCE-KEY-ENCRYPTED",
    "generated_at": None,  # Filled at runtime
    "network_operator": "TwinField Quantum Logistics Network",
    "parties": [
        {
            "hub_id": "Hub_Mumbai",
            "organization": "Western Logistics Authority",
            "role": "Initiator",
            "clearance": "Q-SECRET"
        },
        {
            "hub_id": "Hub_Delhi",
            "organization": "Northern Distribution Command",
            "role": "Responder",
            "clearance": "Q-SECRET"
        },
        {
            "hub_id": "Hub_Chennai",
            "organization": "Southern Maritime Logistics",
            "role": "Responder",
            "clearance": "Q-SECRET"
        }
    ],
    "shipments": [
        {
            "shipment_id": "SHP-2026-QM-4401",
            "origin": "Mumbai Port (INMAA)",
            "destination": "Delhi ICD (INDEL)",
            "cargo_type": "Pharmaceutical Grade-A",
            "container_count": 24,
            "weight_tonnes": 156.8,
            "temperature_range": "2°C - 8°C",
            "estimated_arrival": "2026-07-15T06:00:00Z",
            "priority": "CRITICAL",
            "quantum_seal": None  # Filled with encryption tag
        },
        {
            "shipment_id": "SHP-2026-QC-4402",
            "origin": "Chennai Port (INMAA)",
            "destination": "Delhi Air Cargo (INDEL)",
            "cargo_type": "Semiconductor Wafers",
            "container_count": 8,
            "weight_tonnes": 12.4,
            "temperature_range": "20°C - 25°C",
            "estimated_arrival": "2026-07-16T14:30:00Z",
            "priority": "HIGH",
            "quantum_seal": None
        },
        {
            "shipment_id": "SHP-2026-QD-4403",
            "origin": "Delhi Warehouse (INDEL)",
            "destination": "Mumbai Distribution (INMUM)",
            "cargo_type": "Defence Electronics",
            "container_count": 4,
            "weight_tonnes": 2.1,
            "temperature_range": "Ambient",
            "estimated_arrival": "2026-07-14T09:00:00Z",
            "priority": "CLASSIFIED",
            "quantum_seal": None
        }
    ],
    "protocol_metadata": {
        "key_exchange": "MDI-QKD Conference Key Agreement",
        "encryption_algorithm": "AES-256-GCM",
        "key_derivation": "SHA-256 from entanglement fidelities",
        "relay_trust_model": "Untrusted (Measurement-Device-Independent)",
        "post_quantum_safe": True
    }
}


def encrypt_manifest(conference_key_hex: str) -> dict:
    """
    Encrypt the logistics manifest using AES-256-GCM with the
    quantum-derived conference key.

    Args:
        conference_key_hex: 64-character hex string (256-bit key)

    Returns:
        Dictionary containing:
        - ciphertext: Base64-encoded encrypted manifest
        - nonce: Base64-encoded 96-bit nonce
        - tag: Authentication tag (included in ciphertext by AESGCM)
        - key_fingerprint: First 16 chars of the key for verification
        - plaintext_preview: First 200 chars of plaintext for demo
    """
    key_bytes = bytes.fromhex(conference_key_hex)
    assert len(key_bytes) == 32, "Conference key must be 256 bits"

    # Prepare the manifest
    manifest = LOGISTICS_MANIFEST.copy()
    manifest["generated_at"] = datetime.now(timezone.utc).isoformat()

    # Add quantum seals to shipments
    for shipment in manifest["shipments"]:
        seal_data = f"{shipment['shipment_id']}:{conference_key_hex[:16]}"
        shipment["quantum_seal"] = base64.b64encode(seal_data.encode()).decode()

    plaintext = json.dumps(manifest, indent=2, ensure_ascii=False)
    plaintext_bytes = plaintext.encode("utf-8")

    # Encrypt with AES-256-GCM
    aesgcm = AESGCM(key_bytes)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext_bytes, None)

    return {
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "nonce": base64.b64encode(nonce).decode(),
        "algorithm": "AES-256-GCM",
        "key_fingerprint": conference_key_hex[:16],
        "plaintext_size_bytes": len(plaintext_bytes),
        "ciphertext_size_bytes": len(ciphertext),
        "plaintext_preview": plaintext[:300] + "...",
        "manifest": manifest,
    }


def decrypt_manifest(ciphertext_b64: str, nonce_b64: str, conference_key_hex: str) -> dict:
    """
    Decrypt a previously encrypted logistics manifest.

    Args:
        ciphertext_b64: Base64-encoded ciphertext
        nonce_b64: Base64-encoded nonce
        conference_key_hex: 64-character hex string (256-bit key)

    Returns:
        Decrypted manifest as a dictionary
    """
    key_bytes = bytes.fromhex(conference_key_hex)
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(ciphertext_b64)

    aesgcm = AESGCM(key_bytes)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    return json.loads(plaintext.decode("utf-8"))


if __name__ == "__main__":
    # Test with a sample key
    test_key = "a" * 64  # 256-bit test key
    print("Encrypting logistics manifest...")
    result = encrypt_manifest(test_key)
    print(f"  Plaintext size:  {result['plaintext_size_bytes']} bytes")
    print(f"  Ciphertext size: {result['ciphertext_size_bytes']} bytes")
    print(f"  Key fingerprint: {result['key_fingerprint']}")
    print(f"  Preview: {result['plaintext_preview'][:100]}...")

    print("\nDecrypting...")
    decrypted = decrypt_manifest(result['ciphertext'], result['nonce'], test_key)
    print(f"  Manifest ID: {decrypted['manifest_id']}")
    print(f"  Shipments: {len(decrypted['shipments'])}")
    print("  ✓ Round-trip encryption/decryption successful")
