"""QR code management for pool tables."""

import hashlib
import hmac
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, Union

import qrcode
from PIL import Image

from ...core.monitoring import metrics
from ...utils.security import generate_secure_token


class QRCodeManager:
    """Manages QR code generation and verification for pool tables."""

    def __init__(self):
        """Initialize QR code manager."""
        self.qr_data_format = {
            "version": 1,
            "type": "dojo_pool_table",
            "table_id": None,
            "venue_id": None,
            "timestamp": None,
            "signature": None,
        }
        self.qr_validity_period = timedelta(hours=24)
        self._secret_key = generate_secure_token()

    def generate_table_qr(
        self, table_id: Union[str, int], venue_id: Union[str, int], logo_path: Optional[str] = None
    ) -> Image:
        """Generate QR code for a pool table.

        Args:
            table_id: ID of the pool table
            venue_id: ID of the venue
            logo_path: Optional path to logo image

        Returns:
            PIL Image containing QR code
        """
        try:
            # Create QR data
            qr_data = self.qr_data_format.copy()
            qr_data.update(
                {
                    "table_id": str(table_id),
                    "venue_id": str(venue_id),
                    "timestamp": datetime.utcnow().isoformat(),
                    "signature": self._generate_signature(table_id, venue_id),
                }
            )

            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(json.dumps(qr_data))
            qr.make(fit=True)

            qr_image = qr.make_image(fill_color="black", back_color="white")

            # Add logo if provided
            if logo_path:
                try:
                    logo = Image.open(logo_path)
                    logo = logo.convert("RGBA")

                    # Calculate logo size (max 30% of QR code)
                    logo_size = int(qr_image.size[0] * 0.3)
                    logo = logo.resize((logo_size, logo_size))

                    # Calculate position to center logo
                    pos = (
                        (qr_image.size[0] - logo.size[0]) // 2,
                        (qr_image.size[1] - logo.size[1]) // 2,
                    )

                    # Create mask for smooth edges
                    mask = Image.new("L", logo.size, 0)
                    mask.paste(logo, (0, 0))

                    # Paste logo onto QR code
                    qr_image.paste(logo, pos, mask)
                except Exception as e:
                    metrics.QR_ERRORS.labels(type="logo_error").inc()

            return qr_image

        except Exception as e:
            metrics.QR_ERRORS.labels(type="generation_error").inc()
            raise ValueError(f"Failed to generate QR code: {str(e)}")

    def verify_qr_code(self, qr_data: str) -> Dict:
        """Verify a QR code and extract its data.

        Args:
            qr_data: JSON string containing QR code data

        Returns:
            Dict containing verified QR code data
        """
        try:
            # Parse QR data
            data = json.loads(qr_data)

            # Verify format
            if not all(key in data for key in self.qr_data_format):
                raise ValueError("Invalid QR code format")

            # Verify signature
            if not self._verify_signature(data["table_id"], data["venue_id"], data["signature"]):
                raise ValueError("Invalid QR code signature")

            # Check expiration
            timestamp = datetime.fromisoformat(data["timestamp"])
            if datetime.utcnow() - timestamp > self.qr_validity_period:
                raise ValueError("QR code has expired")

            return data

        except json.JSONDecodeError:
            metrics.QR_ERRORS.labels(type="decode_error").inc()
            raise ValueError("Invalid QR code format")
        except Exception as e:
            metrics.QR_ERRORS.labels(type="verification_error").inc()
            raise ValueError(f"QR code verification failed: {str(e)}")

    def _generate_signature(self, table_id: Union[str, int], venue_id: Union[str, int]) -> str:
        """Generate HMAC signature for QR code data.

        Args:
            table_id: ID of the pool table
            venue_id: ID of the venue

        Returns:
            str: HMAC signature
        """
        msg = f"{table_id}:{venue_id}".encode("utf-8")
        signature = hmac.new(self._secret_key.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        return signature

    def _verify_signature(self, table_id: str, venue_id: str, signature: str) -> bool:
        """Verify HMAC signature of QR code data.

        Args:
            table_id: ID of the pool table
            venue_id: ID of the venue
            signature: HMAC signature to verify

        Returns:
            bool: True if signature is valid
        """
        expected = self._generate_signature(table_id, venue_id)
        return hmac.compare_digest(signature, expected)


# Global instance
qr_manager = QRCodeManager()
