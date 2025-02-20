import io
import logging
from typing import Optional, Union

import torch
from diffusers import StableDiffusionImg2ImgPipeline, StableDiffusionPipeline
from PIL import Image

logger = logging.getLogger(__name__)


class StableDiffusionModel:
    """Stable Diffusion model for avatar generation."""

    def __init__(
        self, model_id: str = "runwayml/stable-diffusion-v1-5", device: str = "cuda"
    ):
        self.model_id = model_id
        self.device = device if torch.cuda.is_available() else "cpu"
        self.txt2img_pipe = None
        self.img2img_pipe = None

        # Default generation parameters
        self.default_height = 512
        self.default_width = 512
        self.default_num_inference_steps = 50
        self.default_guidance_scale = 7.5

    def initialize(self) -> bool:
        """Initialize Stable Diffusion models."""
        try:
            # Initialize text-to-image pipeline
            self.txt2img_pipe = StableDiffusionPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            )
            self.txt2img_pipe.to(self.device)

            # Initialize image-to-image pipeline
            self.img2img_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            )
            self.img2img_pipe.to(self.device)

            # Enable memory efficient attention if available
            if hasattr(self.txt2img_pipe, "enable_attention_slicing"):
                self.txt2img_pipe.enable_attention_slicing()
                self.img2img_pipe.enable_attention_slicing()

            logger.info(f"Stable Diffusion model initialized on {self.device}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Stable Diffusion model: {str(e)}")
            return False

    def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        height: Optional[int] = None,
        width: Optional[int] = None,
        num_inference_steps: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        seed: Optional[int] = None,
    ) -> Optional[Image.Image]:
        """Generate an image from text prompt."""
        try:
            if not self.txt2img_pipe:
                raise RuntimeError("Model not initialized")

            # Set generation parameters
            height = height or self.default_height
            width = width or self.default_width
            num_inference_steps = (
                num_inference_steps or self.default_num_inference_steps
            )
            guidance_scale = guidance_scale or self.default_guidance_scale

            # Set random seed if provided
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)
            else:
                generator = None

            # Generate image
            with torch.no_grad():
                result = self.txt2img_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    generator=generator,
                )

            return result.images[0]

        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            return None

    def transform_image(
        self,
        image: Union[Image.Image, bytes],
        prompt: str,
        negative_prompt: Optional[str] = None,
        strength: float = 0.75,
        num_inference_steps: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        seed: Optional[int] = None,
    ):
        """Transform an existing image using a text prompt."""
        try:
            if not self.img2img_pipe:
                raise RuntimeError("Model not initialized")

            # Convert bytes to PIL Image if needed
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))

            # Ensure image is in RGB mode
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Resize image if needed
            if image.size != (self.default_width, self.default_height):
                image = image.resize(
                    (self.default_width, self.default_height), Image.Resampling.LANCZOS
                )

            # Set generation parameters
            num_inference_steps = (
                num_inference_steps or self.default_num_inference_steps
            )
            guidance_scale = guidance_scale or self.default_guidance_scale

            # Set random seed if provided
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)
            else:
                generator = None

            # Transform image
            with torch.no_grad():
                result = self.img2img_pipe(
                    prompt=prompt,
                    image=image,
                    negative_prompt=negative_prompt,
                    strength=strength,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    generator=generator,
                )

            return result.images[0]

        except Exception as e:
            logger.error(f"Image transformation failed: {str(e)}")
            return None

    def cleanup(self):
        """Clean up model resources."""
        if self.txt2img_pipe:
            del self.txt2img_pipe
            self.txt2img_pipe = None

        if self.img2img_pipe:
            del self.img2img_pipe
            self.img2img_pipe = None

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info("Stable Diffusion model cleaned up")
