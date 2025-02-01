"""Avatar transformation service for DojoPool."""

import os
import time
from io import BytesIO
from typing import Optional, Tuple

from PIL import Image


class AvatarTransformationService:
    """Service for handling avatar transformations."""

    ALLOWED_STYLES = {
        "anime": "Transform the photo into an anime-style character while preserving key facial features",
        "cyberpunk": "Create a cyberpunk-style character with neon accents and futuristic elements",
        "samurai": "Transform into a samurai warrior character with traditional Japanese styling",
    }

    def __init__(self):
        """Initialize the service."""
        pass

    def _validate_image(self, image_data: bytes) -> Tuple[bool, Optional[str]]:
        """Validate image format and size."""
        try:
            img = Image.open(BytesIO(image_data))

            # Check format
            if img.format not in ["JPEG", "PNG"]:
                return False, "Image must be in JPEG or PNG format"

            # Check dimensions
            if img.width < 256 or img.height < 256:
                return False, "Image must be at least 256x256 pixels"

            # Check file size (max 4MB)
            if len(image_data) > 4 * 1024 * 1024:
                return False, "Image must be less than 4MB"

            return True, None

        except Exception as e:
            return False, f"Invalid image: {str(e)}"

    def _prepare_image(self, image_data: bytes) -> bytes:
        """Prepare image for storage."""
        img = Image.open(BytesIO(image_data))

        # Convert to RGB if necessary
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if larger than 1024x1024
        if img.width > 1024 or img.height > 1024:
            img.thumbnail((1024, 1024))

        # Save to bytes
        output = BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()

    def transform_avatar(self, image_data: bytes, style: str) -> Tuple[bytes, Optional[str]]:
        """Transform user photo into stylized avatar.

        Note: Currently just returns the prepared image without transformation
        since OpenAI integration is not available.
        """
        # Validate style
        if style not in self.ALLOWED_STYLES:
            return None, f'Invalid style. Allowed styles: {", ".join(self.ALLOWED_STYLES.keys())}'

        # Validate image
        is_valid, error = self._validate_image(image_data)
        if not is_valid:
            return None, error

        # Prepare and return image without transformation
        return self._prepare_image(image_data), None

    def save_avatar(self, user_id: int, image_data: bytes) -> Tuple[str, Optional[str]]:
        """Save avatar to storage."""
        try:
            # Create user avatars directory if it doesn't exist
            avatar_dir = os.path.join("static", "avatars", str(user_id))
            os.makedirs(avatar_dir, exist_ok=True)

            # Generate unique filename
            filename = f"avatar_{user_id}_{int(time.time())}.png"
            filepath = os.path.join(avatar_dir, filename)

            # Save image
            with open(filepath, "wb") as f:
                f.write(image_data)

            # Return relative path for database storage
            return os.path.join("avatars", str(user_id), filename), None

        except Exception as e:
            return None, f"Failed to save avatar: {str(e)}"


# Create singleton instance
avatar_service = AvatarTransformationService()
