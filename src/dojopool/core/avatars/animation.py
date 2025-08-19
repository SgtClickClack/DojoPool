import io
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class AnimationConfig:
    """Configuration for avatar animation."""

    name: str
    lottie_data: Dict[str, Any]
    duration: float
    frame_rate: int = 30
    loop: bool = True
    trigger: str = "hover"  # hover, click, auto


class AvatarAnimator:
    """Handle avatar animations using Lottie."""

    def __init__(self, animations_path: str):
        self.animations_path = Path(animations_path)
        self.animations: Dict[str, AnimationConfig] = {}
        self.load_animations()

    def load_animations(self):
        """Load animation configurations from JSON files."""
        try:
            if not self.animations_path.exists():
                logger.error(f"Animations directory not found: {self.animations_path}")
                return

            # Load each animation JSON file
            for anim_file in self.animations_path.glob("*.json"):
                try:
                    with open(anim_file, "r") as f:
                        data = json.load(f)

                        # Validate animation data
                        if not self._validate_animation(data):
                            logger.warning(f"Invalid animation file: {anim_file}")
                            continue

                        # Create animation config
                        config = AnimationConfig(
                            name=anim_file.stem,
                            lottie_data=data,
                            duration=data.get("duration", 1.0),
                            frame_rate=data.get("fr", 30),
                            loop=data.get("loop", True),
                            trigger=data.get("trigger", "hover"),
                        )

                        self.animations[config.name] = config
                        logger.info(f"Loaded animation: {config.name}")

                except Exception as e:
                    logger.error(f"Failed to load animation {anim_file}: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to load animations: {str(e)}")

    def _validate_animation(self, data: Dict[str, Any]) -> bool:
        """Validate Lottie animation data."""
        required_fields = ["v", "fr", "ip", "op", "layers"]
        return all(field in data for field in required_fields)

    def get_animation_config(self, name: str) -> Optional[AnimationConfig]:
        """Get animation configuration by name."""
        return self.animations.get(name)

    def list_animations(self) -> List[Dict[str, Any]]:
        """Get list of available animations."""
        return [
            {
                "name": name,
                "duration": config.duration,
                "frame_rate": config.frame_rate,
                "loop": config.loop,
                "trigger": config.trigger,
            }
            for name, config in self.animations.items()
        ]

    @property
    def available_animations(self) -> List[str]:
        """Get list of available animation names."""
        return list(self.animations.keys())

    def create_animation(
        self, avatar_image: Image.Image, animation_type: str, options: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Create an animated version of an avatar."""
        try:
            if animation_type not in self.available_animations:
                raise ValueError(f"Animation type '{animation_type}' not available")

            # Convert PIL Image to bytes
            img_buffer = io.BytesIO()
            avatar_image.save(img_buffer, format="PNG")
            avatar_bytes = img_buffer.getvalue()

            # Apply animation (for now, just return the original image as bytes)
            # In a real implementation, this would create a GIF or video
            return avatar_bytes

        except Exception as e:
            logger.error(f"Animation creation failed: {str(e)}")
            # Return original image as fallback
            img_buffer = io.BytesIO()
            avatar_image.save(img_buffer, format="PNG")
            return img_buffer.getvalue()

    def get_available_animations(self) -> List[Dict[str, Any]]:
        """Get available animations with details."""
        return self.list_animations()

    def apply_animation(
        self, avatar_image: bytes, animation_name: str, frame_index: Optional[int] = None
    ) -> Optional[bytes]:
        """Apply animation to avatar at specific frame."""
        try:
            # Get animation config
            config = self.get_animation_config(animation_name)
            if not config:
                raise ValueError(f"Animation not found: {animation_name}")

            # Load avatar image
            image = Image.open(io.BytesIO(avatar_image))

            # Convert to RGBA if needed
            if image.mode != "RGBA":
                image = image.convert("RGBA")

            # Get animation frame
            frame_data = self._get_animation_frame(config, frame_index)

            # Apply animation frame to image
            animated_image = self._blend_frame(image, frame_data)

            # Convert back to bytes
            output = io.BytesIO()
            animated_image.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to apply animation: {str(e)}")
            return None

    def _get_animation_frame(
        self, config: AnimationConfig, frame_index: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get frame data from animation."""
        # If no frame specified, use first frame
        if frame_index is None:
            frame_index = 0

        # Calculate total frames
        total_frames = int(config.duration * config.frame_rate)

        # Handle frame wrapping for looped animations
        if config.loop:
            frame_index = frame_index % total_frames
        elif frame_index >= total_frames:
            frame_index = total_frames - 1

        # Extract frame data from Lottie animation
        frame_data = self._extract_frame_data(config.lottie_data, frame_index)
        return frame_data

    def _extract_frame_data(self, lottie_data: Dict[str, Any], frame_index: int) -> Dict[str, Any]:
        """Extract frame data from Lottie animation."""
        # This is a placeholder for actual Lottie frame extraction
        # In a real implementation, this would parse the Lottie JSON
        # and extract transform, shape, and effect data for the frame
        return {
            "transform": {"position": [0, 0], "scale": [100, 100], "rotation": 0, "opacity": 100},
            "effects": [],
        }

    def _blend_frame(self, image: Image.Image, frame_data: Dict[str, Any]) -> Image.Image:
        """Blend animation frame with image."""
        try:
            # Convert image to numpy array for processing
            img_array = np.array(image)

            # Apply transforms
            transform = frame_data.get("transform", {})
            img_array = self._apply_transforms(img_array, transform)

            # Apply effects
            effects = frame_data.get("effects", [])
            img_array = self._apply_effects(img_array, effects)

            # Convert back to PIL Image
            return Image.fromarray(img_array)

        except Exception as e:
            logger.error(f"Frame blending failed: {str(e)}")
            return image

    def _apply_transforms(self, img_array: np.ndarray, transform: Dict[str, Any]) -> np.ndarray:
        """Apply geometric transforms to image."""
        try:
            import cv2

            # Get transform parameters
            position = transform.get("position", [0, 0])
            scale = transform.get("scale", [100, 100])
            rotation = transform.get("rotation", 0)
            opacity = transform.get("opacity", 100)

            # Convert scale from percentage to decimal
            scale_x = scale[0] / 100.0
            scale_y = scale[1] / 100.0

            # Get image dimensions
            height, width = img_array.shape[:2]
            center = (width // 2, height // 2)

            # Create transformation matrix
            M = cv2.getRotationMatrix2D(center, rotation, 1.0)

            # Apply scaling
            M[0, 0] *= scale_x
            M[1, 1] *= scale_y

            # Add translation
            M[0, 2] += position[0]
            M[1, 2] += position[1]

            # Apply affine transformation
            transformed = cv2.warpAffine(
                img_array, M, (width, height), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT
            )

            # Apply opacity
            if opacity < 100:
                alpha = opacity / 100.0
                transformed = cv2.addWeighted(
                    transformed, alpha, np.zeros_like(transformed), 1 - alpha, 0
                )

            return transformed

        except Exception as e:
            logger.error(f"Transform application failed: {str(e)}")
            return img_array

    def _apply_effects(self, img_array: np.ndarray, effects: List[Dict[str, Any]]) -> np.ndarray:
        """Apply visual effects to image."""
        try:
            result = img_array.copy()

            # Apply each effect in sequence
            for effect in effects:
                effect_type = effect.get("type")
                params = effect.get("params", {})

                if effect_type == "glow":
                    result = self._apply_glow(result, params)
                elif effect_type == "color":
                    result = self._apply_color_effect(result, params)
                elif effect_type == "blur":
                    result = self._apply_blur(result, params)
                elif effect_type == "particles":
                    result = self._apply_particles(result, params)
                elif effect_type == "wave":
                    result = self._apply_wave_distortion(result, params)

            return result

        except Exception as e:
            logger.error(f"Effect application failed: {str(e)}")
            return img_array

    def _apply_glow(self, img_array: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply glow effect to image."""
        try:
            import cv2

            # Get glow parameters
            intensity = params.get("intensity", 0.5)
            radius = int(params.get("radius", 15))
            color = params.get("color", [255, 255, 255])

            # Create glow mask
            if len(img_array.shape) == 3:
                alpha = img_array[:, :, 3] if img_array.shape[2] == 4 else None
            else:
                alpha = img_array

            if alpha is None:
                return img_array

            # Create color overlay
            color_overlay = np.zeros_like(img_array[:, :, :3])
            color_overlay[:] = color[:3]

            # Create glow mask from alpha channel
            glow_mask = cv2.GaussianBlur(alpha, (radius * 2 + 1, radius * 2 + 1), 0)
            glow_mask = cv2.multiply(glow_mask, intensity)

            # Apply glow
            result = img_array.copy()
            for i in range(3):
                result[:, :, i] = cv2.addWeighted(
                    result[:, :, i],
                    1.0,
                    cv2.multiply(color_overlay[:, :, i], glow_mask / 255.0),
                    1.0,
                    0,
                )

            return result

        except Exception as e:
            logger.error(f"Glow effect failed: {str(e)}")
            return img_array

    def _apply_color_effect(self, img_array: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply color modification effect to image."""
        try:
            import cv2

            # Get color parameters
            hue_shift = params.get("hue_shift", 0)  # -180 to 180
            saturation_scale = params.get("saturation", 1.0)  # 0 to 2
            value_scale = params.get("value", 1.0)  # 0 to 2
            tint_color = params.get("tint", None)  # [R, G, B]
            tint_strength = params.get("tint_strength", 0.3)  # 0 to 1

            # Convert to HSV
            hsv = cv2.cvtColor(img_array[:, :, :3], cv2.COLOR_RGB2HSV)

            # Apply HSV adjustments
            hsv[:, :, 0] = (hsv[:, :, 0] + hue_shift) % 180
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_scale, 0, 255)
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * value_scale, 0, 255)

            # Convert back to RGB
            result = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)

            # Apply tint if specified
            if tint_color is not None:
                tint = np.zeros_like(result)
                tint[:] = tint_color[:3]
                result = cv2.addWeighted(result, 1 - tint_strength, tint, tint_strength, 0)

            # Preserve alpha channel if it exists
            if img_array.shape[2] == 4:
                result = np.dstack((result, img_array[:, :, 3]))

            return result

        except Exception as e:
            logger.error(f"Color effect failed: {str(e)}")
            return img_array

    def _apply_blur(self, img_array: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply blur effect to image."""
        try:
            import cv2

            # Get blur parameters
            radius = params.get("radius", 5)
            blur_type = params.get("type", "gaussian")

            if blur_type == "gaussian":
                return cv2.GaussianBlur(img_array, (radius * 2 + 1, radius * 2 + 1), 0)
            elif blur_type == "motion":
                kernel = np.zeros((radius, radius))
                kernel[radius // 2, :] = 1
                kernel = kernel / radius
                return cv2.filter2D(img_array, -1, kernel)
            else:
                return cv2.blur(img_array, (radius, radius))

        except Exception as e:
            logger.error(f"Blur effect failed: {str(e)}")
            return img_array

    def _apply_particles(self, img_array: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply particle effect to image."""
        try:
            # Get particle parameters
            num_particles = params.get("count", 50)
            particle_size = params.get("size", 3)
            particle_color = params.get("color", [255, 255, 255])
            params.get("spread", 0.5)

            result = img_array.copy()
            height, width = result.shape[:2]

            # Generate random particle positions
            positions = np.random.rand(num_particles, 2)
            positions[:, 0] *= width
            positions[:, 1] *= height

            # Draw particles
            for x, y in positions.astype(int):
                cv2.circle(result, (x, y), particle_size, particle_color, -1)

            return result

        except Exception as e:
            logger.error(f"Particle effect failed: {str(e)}")
            return img_array

    def _apply_wave_distortion(self, img_array: np.ndarray, params: Dict[str, Any]) -> np.ndarray:
        """Apply wave distortion effect to image."""
        try:
            # Get wave parameters
            amplitude = params.get("amplitude", 10)
            frequency = params.get("frequency", 0.1)
            phase = params.get("phase", 0)
            direction = params.get("direction", "horizontal")

            height, width = img_array.shape[:2]
            result = np.zeros_like(img_array)

            # Create displacement maps
            if direction == "horizontal":
                for y in range(height):
                    offset = int(amplitude * np.sin(2 * np.pi * frequency * y + phase))
                    for x in range(width):
                        src_x = (x + offset) % width
                        result[y, x] = img_array[y, src_x]
            else:
                for x in range(width):
                    offset = int(amplitude * np.sin(2 * np.pi * frequency * x + phase))
                    for y in range(height):
                        src_y = (y + offset) % height
                        result[y, x] = img_array[src_y, x]

            return result

        except Exception as e:
            logger.error(f"Wave distortion effect failed: {str(e)}")
            return img_array
