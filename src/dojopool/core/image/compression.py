"""
Image compression service with support for AVIF, WebP, and JPEG formats.
Includes batch processing and memory optimization features.
"""

import gc
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import psutil
from PIL import Image

from ...config.compression_config import DEFAULT_COMPRESSION_CONFIG

logger = logging.getLogger(__name__)


class ImageFormat(Enum):
    """Supported image formats."""

    AVIF = "avif"
    WEBP = "webp"
    JPEG = "jpeg"
    PNG = "png"


@dataclass
class CompressionConfig:
    """Configuration for image compression."""

    format: ImageFormat
    quality: int  # 1-100
    target_size: Optional[Tuple[int, int]] = None  # (width, height)
    maintain_aspect_ratio: bool = True
    strip_metadata: bool = True
    optimize: bool = True
    speed: Optional[int] = None  # AVIF encoding speed (1-10, default 6)
    threads: Optional[int] = None  # Number of threads for AVIF encoding


@dataclass
class BatchProcessingResult:
    """Result of batch image processing."""

    successful: List[str]
    failed: List[Tuple[str, str]]  # (filename, error_message)
    total_input_size: int
    total_output_size: int


class ImageCompressionService:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the compression service."""
        self.config = config or DEFAULT_COMPRESSION_CONFIG.copy()
        self._supported_formats = {
            ImageFormat.AVIF: {"mime": "image/avif", "extensions": [".avif"]},
            ImageFormat.WEBP: {"mime": "image/webp", "extensions": [".webp"]},
            ImageFormat.JPEG: {"mime": "image/jpeg", "extensions": [".jpg", ".jpeg"]},
            ImageFormat.PNG: {"mime": "image/png", "extensions": [".png"]},
        }

    def _get_optimal_chunk_size(self) -> int:
        """Calculate optimal chunk size based on available memory."""
        available_memory = psutil.virtual_memory().available
        memory_per_image = 30 * 1024 * 1024  # 30MB estimate per image
        optimal_size = min(
            max(5, available_memory // (memory_per_image * 2)),  # Leave 50% buffer
            20,  # Maximum chunk size
        )
        logger.info(
            f"Calculated optimal chunk size: {optimal_size} based on {available_memory / (1024*1024):.2f}MB available memory"
        )
        return optimal_size

    def _get_optimal_quality(self, file_size_bytes: int) -> Dict[str, int]:
        """Adjust quality settings based on input file size."""
        size_mb = file_size_bytes / (1024 * 1024)

        if size_mb < 1:
            return {"jpeg_quality": 85, "webp_quality": 80, "avif_quality": 75}
        elif size_mb < 5:
            return {"jpeg_quality": 80, "webp_quality": 75, "avif_quality": 70}
        else:
            return {"jpeg_quality": 75, "webp_quality": 70, "avif_quality": 65}

    def _process_single_file(
        self, input_path: str, output_dir: str, filename: str, config: CompressionConfig
    ) -> Dict[str, Any]:
        """Process a single image file."""
        try:
            # Get input file size
            input_size = os.path.getsize(input_path)

            # Adjust quality based on file size
            quality_settings = self._get_optimal_quality(input_size)
            config.quality = quality_settings[f"{config.format.value}_quality"]

            # Create variant directory
            variant_dir = os.path.join(output_dir, filename)
            os.makedirs(variant_dir, exist_ok=True)

            # Process image
            with Image.open(input_path) as img:
                # Convert RGBA to RGB if needed
                if img.mode == "RGBA" and config.format != ImageFormat.PNG:
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3])
                    img = background

                # Resize if target size specified
                if config.target_size:
                    img.thumbnail(config.target_size, Image.Resampling.LANCZOS)

                # Save with format-specific settings
                output_path = os.path.join(variant_dir, f"{filename}.{config.format.value}")
                save_args = {"quality": config.quality, "optimize": config.optimize}

                if config.format == ImageFormat.AVIF:
                    save_args["speed"] = config.speed or 6
                    if config.threads:
                        save_args["threads"] = config.threads

                img.save(output_path, format=config.format.value.upper(), **save_args)

            # Get output file size
            output_size = os.path.getsize(output_path)

            result = {"path": output_path, "input_size": input_size, "output_size": output_size}
            return result

        except Exception as e:
            logger.error(f"Error processing file {input_path}: {str(e)}")
            raise

    def batch_compress_directory(
        self, input_dir: str, output_dir: str, chunk_size: Optional[int] = None
    ) -> BatchProcessingResult:
        """Process all images in a directory with configured variants.

        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            chunk_size: Optional override for chunk size

        Returns:
            BatchProcessingResult with processing statistics
        """
        # Get optimal chunk size if not specified
        chunk_size = chunk_size or self._get_optimal_chunk_size()
        successful = []
        failed = []
        total_input_size = 0
        total_output_size = 0

        try:
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)

            # Get list of image files
            image_files = []
            for root, _, files in os.walk(input_dir):
                for file in files:
                    if any(
                        file.lower().endswith(ext)
                        for format_info in self._supported_formats.values()
                        for ext in format_info["extensions"]
                    ):
                        image_files.append(os.path.join(root, file))

            # Calculate optimal thread count based on CPU cores
            cpu_count = psutil.cpu_count(logical=False) or 1
            max_workers = min(cpu_count - 1 or 1, 8)  # Leave one core free, max 8 threads

            # Process in chunks
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                for i in range(0, len(image_files), chunk_size):
                    # Check available memory before processing chunk
                    if psutil.virtual_memory().percent > 80:
                        logger.warning("High memory usage detected, reducing chunk size")
                        chunk_size = max(chunk_size - 2, 5)  # Reduce chunk size but not below 5
                        gc.collect()  # Force garbage collection
                        time.sleep(1)  # Give system time to stabilize

                    chunk = image_files[i : i + chunk_size]
                    futures = []

                    for input_path in chunk:
                        os.path.relpath(input_path, input_dir)
                        filename = os.path.splitext(os.path.basename(input_path))[0]
                        futures.append(
                            executor.submit(
                                self._process_single_file,
                                input_path,
                                output_dir,
                                filename,
                                CompressionConfig(
                                    format=ImageFormat.AVIF,
                                    quality=self.config.get("avif_quality", 75),
                                    target_size=self.config.get("target_size"),
                                    speed=self.config.get("avif_speed", 6),
                                    threads=1,  # Single-threaded AVIF encoding for better memory usage
                                ),
                            )
                        )

                    # Collect results
                    for future in futures:
                        try:
                            result = future.result()
                            successful.append(result["path"])
                            total_input_size += result["input_size"]
                            total_output_size += result["output_size"]
                        except Exception as e:
                            failed.append((str(future), str(e)))

                    # Clean up after each chunk
                    gc.collect()

                    # Log progress
                    progress = (i + len(chunk)) / len(image_files) * 100
                    logger.info(
                        f"Progress: {progress:.1f}% ({i + len(chunk)}/{len(image_files)} images)"
                    )

            return BatchProcessingResult(
                successful=successful,
                failed=failed,
                total_input_size=total_input_size,
                total_output_size=total_output_size,
            )

        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
            raise
