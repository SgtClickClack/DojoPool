import gc
import gc
"""Authentication utilities for DojoPool."""

import base64
import logging
import re
import secrets
import string
from datetime import datetime, timedelta
from io import BytesIO
from typing import Any, Dict, Optional

import pyotp
import qrcode

logger = logging.getLogger(__name__)


def generate_password(length: int = 16) -> str:
    """Generate a secure random password.

    Args:
        length: Password length

    Returns:
        Generated password
    """
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    # Fill remaining length with random characters
    all_chars = lowercase + uppercase + digits + special
    password.extend(secrets.choice(all_chars) for _ in range(length - 4))

    # Shuffle password
    password_list = list(password)
    secrets.SystemRandom().shuffle(password_list)

    return "".join(password_list)


def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength.

    Args:
        password: Password to validate

    Returns:
        Dictionary containing validation results
    """
    results = {
        "length": len(password) >= 8,
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "lowercase": bool(re.search(r"[a-z]", password)),
        "digits": bool(re.search(r"\d", password)),
        "special": bool(re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]", password)),
        "score": 0,
    }

    # Calculate score (0-5)
    results["score"] = sum(
        1 for key, value in results.items() if key != "score" and value
    )

    return results


def generate_totp_secret() -> str:
    """Generate a TOTP secret.

    Returns:
        TOTP secret
    """
    return pyotp.random_base32()


def generate_totp_uri(secret: str, username: str, issuer: str = "DojoPool"):
    """Generate TOTP URI for QR code.

    Args:
        secret: TOTP secret
        username: Username
        issuer: Issuer name

    Returns:
        TOTP URI
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(username, issuer_name=issuer)


def generate_qr_code(data: str):
    """Generate QR code as base64 string.

    Args:
        data: Data to encode

    Returns:
        Base64 encoded QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")

    return base64.b64encode(buffer.getvalue()).decode()


def verify_totp(secret: str, token: str):
    """Verify TOTP token.

    Args:
        secret: TOTP secret
        token: Token to verify

    Returns:
        True if token is valid
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(token)


def generate_backup_codes(count: int = 10) -> list:
    """Generate backup codes.

    Args:
        count: Number of codes to generate

    Returns:
        List of backup codes
    """
    codes = []
    for _ in range(count):
        # Generate 8 character code
        code = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)
        )
        # Insert hyphen for readability
        code = f"{code[:4]}-{code[4:]}"
        codes.append(code)
    return codes


def mask_email(email: str) -> str:
    """Mask email address for display.

    Args:
        email: Email address

    Returns:
        Masked email address
    """
    username, domain = email.split("@")
    masked_username = username[0] + "*" * (len(username) - 2) + username[-1]
    return f"{masked_username}@{domain}"


def generate_session_id() -> str:
    """Generate a secure session ID.

    Returns:
        Session ID
    """
    return secrets.token_urlsafe(32)


def parse_auth_header(header: str):
    """Parse Authorization header.

    Args:
        header: Authorization header

    Returns:
        Token if valid, None otherwise
    """
    if not header:
        return None

    parts = header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def calculate_token_expiry(duration: timedelta):
    """Calculate token expiry time.

    Args:
        duration: Token duration

    Returns:
        Expiry datetime
    """
    return datetime.utcnow() + duration


def is_token_expired(expiry: datetime):
    """Check if token is expired.

    Args:
        expiry: Token expiry datetime

    Returns:
        True if token is expired
    """
    return datetime.utcnow() > expiry
