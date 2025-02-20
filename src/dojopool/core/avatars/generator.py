import io
import logging
from dataclasses import dataclass
from typing import Optional, Union

import torchvision.transforms as transforms
from PIL import Image

from .model import StableDiffusionModel

logger = logging.getLogger(__name__)


@dataclass
class AvatarStyle:
    """Avatar style configuration."""

    style_name: str
    base_prompt: str
    negative_prompt: str
    strength: float = 0.75
    guidance_scale: float = 7.5
    num_inference_steps: int = 50


class AvatarGenerator:
    """Generate and manage user avatars using AI models."""

    def __init__(
        self, model_id: str = "runwayml/stable-diffusion-v1-5", device: str = "cuda"
    ):
        self.model = StableDiffusionModel(model_id=model_id, device=device)
        self.transform = transforms.Compose(
            [
                transforms.Resize((512, 512)),
                transforms.ToTensor(),
                transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
            ]
        )

        # Predefined avatar styles
        self.styles = {
            "kung_fu_master": AvatarStyle(
                style_name="Kung Fu Master",
                base_prompt="highly detailed anime portrait of a kung fu master, "
                "dynamic pose, martial arts attire, intense expression, "
                "detailed eyes, professional lighting, masterpiece, "
                "best quality, intricate details",
                negative_prompt="low quality, blurry, distorted, bad anatomy, "
                "deformed, ugly, bad proportions",
            ),
            "modern_warrior": AvatarStyle(
                style_name="Modern Warrior",
                base_prompt="detailed anime portrait of a modern pool player with "
                "warrior spirit, confident pose, stylish urban attire, "
                "determined expression, dramatic lighting, masterpiece, "
                "best quality, sharp focus",
                negative_prompt="low quality, deformed, cartoon, childish, "
                "blurry, bad anatomy",
            ),
            "mystic_player": AvatarStyle(
                style_name="Mystic Player",
                base_prompt="mystical anime character portrait, pool player with "
                "supernatural aura, glowing effects, ethereal lighting, "
                "detailed face features, masterpiece, best quality, "
                "magical atmosphere",
                negative_prompt="low quality, simple, flat, boring, bad anatomy, "
                "blurry, pixelated",
            ),
        }

    def initialize(self):
        """Initialize the avatar generation model."""
        try:
            return self.model.initialize()
        except Exception as e:
            logger.error(f"Failed to initialize avatar model: {str(e)}")
            return False

    def generate_avatar(
        self,
        style_name: str,
        seed: Optional[int] = None,
        custom_prompt: Optional[str] = None,
    ):
        """Generate a new avatar image."""
        try:
            # Get style configuration
            style = self.styles.get(style_name)
            if not style:
                raise ValueError(f"Unknown style: {style_name}")

            # Combine base prompt with custom prompt if provided
            prompt = (
                f"{style.base_prompt}, {custom_prompt}"
                if custom_prompt
                else style.base_prompt
            )

            # Generate image
            image = self.model.generate_image(
                prompt=prompt,
                negative_prompt=style.negative_prompt,
                guidance_scale=style.guidance_scale,
                num_inference_steps=style.num_inference_steps,
                seed=seed,
            )

            if not image:
                raise RuntimeError("Image generation failed")

            # Convert to bytes
            return self._image_to_bytes(image)

        except Exception as e:
            logger.error(f"Avatar generation failed: {str(e)}")
            return None

    def customize_avatar(
        self,
        base_image: Union[Image.Image, bytes],
        style_name: str,
        strength: Optional[float] = None,
        seed: Optional[int] = None,
        custom_prompt: Optional[str] = None,
    ) -> Optional[bytes]:
        """Customize an existing avatar image."""
        try:
            # Get style configuration
            style = self.styles.get(style_name)
            if not style:
                raise ValueError(f"Unknown style: {style_name}")

            # Combine base prompt with custom prompt if provided
            prompt = (
                f"{style.base_prompt}, {custom_prompt}"
                if custom_prompt
                else style.base_prompt
            )

            # Transform image
            image = self.model.transform_image(
                image=base_image,
                prompt=prompt,
                negative_prompt=style.negative_prompt,
                strength=strength or style.strength,
                guidance_scale=style.guidance_scale,
                num_inference_steps=style.num_inference_steps,
                seed=seed,
            )

            if not image:
                raise RuntimeError("Image transformation failed")

            # Convert to bytes
            return self._image_to_bytes(image)

        except Exception as e:
            logger.error(f"Avatar customization failed: {str(e)}")
            return None

    def _image_to_bytes(self, image: Image.Image):
        """Convert PIL Image to bytes."""
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()

    def cleanup(self):
        """Clean up resources."""
        if self.model:
            self.model.cleanup()
