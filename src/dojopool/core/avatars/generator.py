import io
import logging
import random
from dataclasses import dataclass
from typing import Optional, Union

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

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
    """Generate and manage user avatars using simple image processing."""

    def __init__(self):
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
                negative_prompt="low quality, deformed, cartoon, childish, " "blurry, bad anatomy",
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

    def initialize(self) -> bool:
        """Initialize the avatar generation system."""
        try:
            logger.info("Avatar generation system initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize avatar system: {str(e)}")
            return False

    def generate_avatar(
        self, style_name: str, custom_prompt: Optional[str] = None
    ) -> Optional[bytes]:
        """Generate a new avatar image."""
        try:
            # Get style configuration
            style = self.styles.get(style_name)
            if not style:
                raise ValueError(f"Unknown style: {style_name}")

            # Create a stylized avatar based on the style
            image = self._create_stylized_avatar(style, custom_prompt)
            
            if not image:
                raise RuntimeError("Avatar generation failed")

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
        custom_prompt: Optional[str] = None,
    ) -> Optional[bytes]:
        """Customize an existing avatar image."""
        try:
            # Get style configuration
            style = self.styles.get(style_name)
            if not style:
                raise ValueError(f"Unknown style: {style_name}")

            # Convert bytes to PIL Image if needed
            if isinstance(base_image, bytes):
                base_image = Image.open(io.BytesIO(base_image))

            # Apply style effects to the base image
            styled_image = self._apply_style_effects(base_image, style, strength or style.strength)

            if not styled_image:
                raise RuntimeError("Avatar customization failed")

            # Convert to bytes
            return self._image_to_bytes(styled_image)

        except Exception as e:
            logger.error(f"Avatar customization failed: {str(e)}")
            return None

    def _create_stylized_avatar(self, style: AvatarStyle, custom_prompt: Optional[str] = None) -> Optional[Image.Image]:
        """Create a stylized avatar based on the style."""
        try:
            # Create a base image
            size = (512, 512)
            image = Image.new('RGB', size, (50, 50, 50))
            draw = ImageDraw.Draw(image)

            # Apply different effects based on style
            if style.style_name == "Kung Fu Master":
                return self._create_kung_fu_avatar(draw, size)
            elif style.style_name == "Modern Warrior":
                return self._create_modern_warrior_avatar(draw, size)
            elif style.style_name == "Mystic Player":
                return self._create_mystic_avatar(draw, size)
            else:
                return self._create_default_avatar(draw, size)

        except Exception as e:
            logger.error(f"Failed to create stylized avatar: {str(e)}")
            return None

    def _create_kung_fu_avatar(self, draw: ImageDraw.Draw, size: tuple) -> Image.Image:
        """Create a kung fu master style avatar."""
        width, height = size
        
        # Create gradient background
        for y in range(height):
            color = int(255 * (1 - y / height))
            draw.line([(0, y), (width, y)], fill=(color//3, color//2, color))
        
        # Add martial arts elements
        # Head
        draw.ellipse([width//2-60, height//2-120, width//2+60, height//2-60], fill=(139, 69, 19))
        
        # Body
        draw.rectangle([width//2-40, height//2-60, width//2+40, height//2+60], fill=(25, 25, 112))
        
        # Arms in fighting stance
        draw.rectangle([width//2-80, height//2-40, width//2-40, height//2+20], fill=(25, 25, 112))
        draw.rectangle([width//2+40, height//2-40, width//2+80, height//2+20], fill=(25, 25, 112))
        
        # Pool cue
        draw.rectangle([width//2-5, height//2+60, width//2+5, height//2+120], fill=(139, 69, 19))
        
        # Add glow effects
        image = draw._image
        image = image.filter(ImageFilter.GaussianBlur(1))
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        return image

    def _create_modern_warrior_avatar(self, draw: ImageDraw.Draw, size: tuple) -> Image.Image:
        """Create a modern warrior style avatar."""
        width, height = size
        
        # Create cyberpunk background
        for y in range(height):
            color = int(255 * (y / height))
            draw.line([(0, y), (width, y)], fill=(color//4, color//8, color//2))
        
        # Add modern elements
        # Head with futuristic helmet
        draw.ellipse([width//2-50, height//2-100, width//2+50, height//2-50], fill=(64, 64, 64))
        
        # Body armor
        draw.rectangle([width//2-35, height//2-50, width//2+35, height//2+50], fill=(32, 32, 32))
        
        # Tech details
        draw.rectangle([width//2-30, height//2-45, width//2+30, height//2-35], fill=(0, 255, 255))
        
        # Pool cue with tech elements
        draw.rectangle([width//2-3, height//2+50, width//2+3, height//2+110], fill=(0, 255, 255))
        
        # Add neon effects
        image = draw._image
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.1)
        
        return image

    def _create_mystic_avatar(self, draw: ImageDraw.Draw, size: tuple) -> Image.Image:
        """Create a mystic player style avatar."""
        width, height = size
        
        # Create mystical background
        for y in range(height):
            color = int(255 * (1 - y / height))
            draw.line([(0, y), (width, y)], fill=(color//2, color//4, color))
        
        # Add mystical elements
        # Aura effect
        for i in range(3):
            offset = i * 10
            draw.ellipse([width//2-70+offset, height//2-130+offset, width//2+70-offset, height//2-70-offset], 
                        fill=(255//(i+1), 0, 255//(i+1)), outline=(255, 0, 255))
        
        # Mystical figure
        draw.ellipse([width//2-45, height//2-90, width//2+45, height//2-40], fill=(75, 0, 130))
        draw.rectangle([width//2-30, height//2-40, width//2+30, height//2+40], fill=(75, 0, 130))
        
        # Magical pool cue
        draw.rectangle([width//2-2, height//2+40, width//2+2, height//2+100], fill=(255, 0, 255))
        
        # Add magical glow
        image = draw._image
        image = image.filter(ImageFilter.GaussianBlur(2))
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.5)
        
        return image

    def _create_default_avatar(self, draw: ImageDraw.Draw, size: tuple) -> Image.Image:
        """Create a default avatar."""
        width, height = size
        
        # Simple gradient background
        for y in range(height):
            color = int(255 * (1 - y / height))
            draw.line([(0, y), (width, y)], fill=(color//3, color//3, color//3))
        
        # Simple figure
        draw.ellipse([width//2-40, height//2-80, width//2+40, height//2-30], fill=(139, 69, 19))
        draw.rectangle([width//2-25, height//2-30, width//2+25, height//2+30], fill=(70, 130, 180))
        draw.rectangle([width//2-2, height//2+30, width//2+2, height//2+90], fill=(139, 69, 19))
        
        return draw._image

    def _apply_style_effects(self, image: Image.Image, style: AvatarStyle, strength: float) -> Optional[Image.Image]:
        """Apply style effects to an existing image."""
        try:
            # Resize image to standard size
            image = image.resize((512, 512), Image.Resampling.LANCZOS)
            
            # Apply effects based on style
            if style.style_name == "Kung Fu Master":
                return self._apply_kung_fu_effects(image, strength)
            elif style.style_name == "Modern Warrior":
                return self._apply_modern_effects(image, strength)
            elif style.style_name == "Mystic Player":
                return self._apply_mystic_effects(image, strength)
            else:
                return image
                
        except Exception as e:
            logger.error(f"Failed to apply style effects: {str(e)}")
            return None

    def _apply_kung_fu_effects(self, image: Image.Image, strength: float) -> Image.Image:
        """Apply kung fu master effects."""
        # Enhance contrast and add warm tones
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.0 + strength * 0.5)
        
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.0 + strength * 0.3)
        
        return image

    def _apply_modern_effects(self, image: Image.Image, strength: float) -> Image.Image:
        """Apply modern warrior effects."""
        # Add cool tones and enhance brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.0 + strength * 0.2)
        
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.0 + strength * 0.4)
        
        return image

    def _apply_mystic_effects(self, image: Image.Image, strength: float) -> Image.Image:
        """Apply mystic player effects."""
        # Add blur and enhance colors
        image = image.filter(ImageFilter.GaussianBlur(strength))
        
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.0 + strength * 0.6)
        
        return image

    def _image_to_bytes(self, image: Image.Image) -> bytes:
        """Convert PIL Image to bytes."""
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()

    def generate_default(self) -> Image.Image:
        """Generate a default avatar image."""
        try:
            size = (512, 512)
            image = Image.new('RGB', size, (100, 100, 100))
            draw = ImageDraw.Draw(image)
            return self._create_default_avatar(draw, size)
        except Exception as e:
            logger.error(f"Default avatar generation failed: {str(e)}")
            return self._create_placeholder_image()

    def from_bytes(self, image_bytes: bytes) -> Image.Image:
        """Create PIL Image from bytes."""
        try:
            return Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logger.error(f"Failed to create image from bytes: {str(e)}")
            return self._create_placeholder_image()

    def get_available_styles(self) -> dict:
        """Get available avatar styles."""
        return {
            name: {
                "name": style.style_name,
                "base_prompt": style.base_prompt,
                "strength": style.strength,
                "guidance_scale": style.guidance_scale,
                "num_inference_steps": style.num_inference_steps,
            }
            for name, style in self.styles.items()
        }

    def _create_placeholder_image(self) -> Image.Image:
        """Create a simple placeholder image."""
        # Create a simple 512x512 placeholder image
        image = Image.new('RGB', (512, 512), color=(100, 100, 100))
        return image

    def cleanup(self):
        """Clean up resources."""
        logger.info("Avatar generation system cleaned up")
