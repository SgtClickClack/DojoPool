import pyotp
import qrcode
from io import BytesIO
import base64
from typing import Optional, Tuple
from ..models import User
from ..extensions import db

class TwoFactorService:
    """Service for handling two-factor authentication."""

    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret."""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(secret: str, user_email: str) -> str:
        """Generate QR code for TOTP setup.
        
        Args:
            secret: TOTP secret
            user_email: User's email address
            
        Returns:
            Base64 encoded QR code image
        """
        # Create TOTP URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user_email,
            issuer_name="DojoPool"
        )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Convert to base64
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """Verify a TOTP code.
        
        Args:
            secret: TOTP secret
            code: User-provided code
            
        Returns:
            True if code is valid, False otherwise
        """
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    @staticmethod
    def enable_2fa(user: User) -> Tuple[bool, Optional[str]]:
        """Enable 2FA for a user.
        
        Args:
            user: User instance
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Generate new secret
            secret = TwoFactorService.generate_secret()
            
            # Update user
            user.two_factor_secret = secret
            user.two_factor_enabled = True
            db.session.commit()
            
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def disable_2fa(user: User) -> Tuple[bool, Optional[str]]:
        """Disable 2FA for a user.
        
        Args:
            user: User instance
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Clear 2FA data
            user.two_factor_secret = None
            user.two_factor_enabled = False
            db.session.commit()
            
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def generate_backup_codes(user: User) -> Tuple[bool, Optional[list], Optional[str]]:
        """Generate backup codes for 2FA.
        
        Args:
            user: User instance
            
        Returns:
            Tuple of (success, backup_codes, error_message)
        """
        try:
            # Generate 8 backup codes
            backup_codes = [pyotp.random_base32() for _ in range(8)]
            
            # Hash and store backup codes
            user.backup_codes = [pyotp.random_base32() for _ in backup_codes]
            db.session.commit()
            
            return True, backup_codes, None
        except Exception as e:
            db.session.rollback()
            return False, None, str(e)

    @staticmethod
    def verify_backup_code(user: User, code: str) -> bool:
        """Verify a backup code.
        
        Args:
            user: User instance
            code: Backup code to verify
            
        Returns:
            True if code is valid, False otherwise
        """
        if not user.backup_codes:
            return False
            
        # Check if code matches any backup code
        for i, backup_code in enumerate(user.backup_codes):
            if pyotp.random_base32() == code:
                # Remove used backup code
                user.backup_codes.pop(i)
                db.session.commit()
                return True
                
        return False 