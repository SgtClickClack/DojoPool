import io
import logging
from pathlib import Path
from typing import Any, BinaryIO, Dict, Union

from PIL import Image


def is_webp_supported() -> bool:
    """Check if WebP format is supported by the current Pillow installation."""
    try:
        # Check multiple indicators of WebP support
        from PIL import features

        webp_features = features.get_supported_features()
        any("webp" in feature.lower() for feature in webp_features)

        # Try creating a test WebP image
        test_img = Image.new("RGB", (1, 1))
        test_buffer = io.BytesIO()
        test_img.save(test_buffer, format="WEBP")

        return True
    except Exception:
        return False


def optimize_webp_settings(img: Image.Image) -> Dict[str, Union[int, bool]]:
    """Determine optimal WebP conversion settings based on image content.

    Args:
        img: PIL Image object to analyze

    Returns:
        dict: Optimized WebP conversion settings
    """
    settings: Dict[str, Union[int, bool]] = {"quality": 80}  # Default settings

    # Check if image has transparency
    has_transparency = img.mode in ("RGBA", "LA") or (
        img.mode == "P" and "transparency" in img.info
    )
    if has_transparency:
        settings["lossless"] = True  # Use lossless compression for images with transparency

    # Analyze image complexity
    try:
        # Convert to grayscale for complexity analysis
        gray = img.convert("L")
        # Calculate standard deviation as a measure of image complexity
        pixels = list(gray.getdata())
        import statistics

        complexity = statistics.stdev(pixels) / 255.0  # Normalize to 0-1

        # Adjust quality based on complexity
        if complexity < 0.1:  # Simple image (e.g., flat colors, simple graphics)
            settings["quality"] = 70
        elif complexity > 0.3:  # Complex image (e.g., photos with lots of detail)
            settings["quality"] = 90
            settings["method"] = 6  # Use best compression method for complex images
    except Exception:
        pass  # Fall back to default settings if analysis fails

    return settings


def convert_to_webp(
    source: Union[str, Path, BinaryIO],
    destination: Union[str, Path, BinaryIO],
    quality: int = 80,
    preserve_metadata: bool = True,
    optimize: bool = True,
) -> bool:
    """Convert an image to WebP format.

    Args:
        source: Input image file path or file-like object
        destination: Output WebP file path or file-like object
        quality: WebP quality (0-100)
        preserve_metadata: Whether to preserve image metadata
        optimize: Whether to optimize WebP settings based on image content

    Returns:
        bool: True if conversion was successful

    Raises:
        ValueError: If input parameters are invalid
        IOError: If there are issues reading/writing files
    """
    if not is_webp_supported():
        raise RuntimeError("WebP format is not supported by the current Pillow installation")

    if source is None or destination is None:
        raise ValueError("Source and destination must be provided")

    if isinstance(source, str) and not source:
        raise ValueError("Source path cannot be empty")

    if not isinstance(quality, int) or quality < 0 or quality > 100:
        raise ValueError("Quality must be an integer between 0 and 100")

    try:
        # Open source image
        if isinstance(source, (str, Path)):
            source_path = Path(source)
            if not source_path.exists():
                raise ValueError(f"Source file does not exist: {source}")
            if not source_path.is_file():
                raise ValueError(f"Source path is not a file: {source}")
            img = Image.open(source_path)
        else:
            img = Image.open(source)

        # Preserve original mode and metadata
        original_mode = img.mode
        # Convert metadata to string-keyed dictionary and handle special cases
        metadata: Dict[str, Any] = {}
        if preserve_metadata:
            for k, v in img.info.items():
                k = str(k)
                # Handle special metadata cases
                if k == "dpi":
                    metadata["resolution"] = v  # WebP uses 'resolution' instead of 'dpi'
                elif k in ["icc_profile", "exif"]:
                    metadata[k] = v  # These are supported directly
                else:
                    metadata[k] = v  # Other metadata

        # Convert to RGBA if transparent
        if original_mode == "RGBA":
            # WebP supports RGBA directly
            converted = img
        else:
            # Convert to RGB for other modes
            converted = img.convert("RGB")

        # Get optimized settings if requested
        save_settings: Dict[str, Any] = {"quality": quality}
        if optimize:
            save_settings.update(optimize_webp_settings(converted))
        save_settings.update(metadata)

        # Save as WebP
        if isinstance(destination, (str, Path)):
            converted.save(str(destination), "WebP", **save_settings)
        else:
            converted.save(destination, "WebP", **save_settings)

        return True

    except Exception as e:
        logging.error(f"Error converting image to WebP: {str(e)}")
        raise


def create_size_variants(
    source: Union[str, Path],
    output_dir: Union[str, Path],
    sizes: dict[str, tuple[int, int]],
    format: str = "WEBP",
) -> dict[str, str]:
    """Create multiple size variants of an image.

    Args:
        source: Source image path
        output_dir: Directory to save variants
        sizes: Dictionary mapping variant names to (width, height) tuples
        format: Output format (default: WEBP)

    Returns:
        dict: Mapping of variant names to their file paths
    """
    source_path = Path(source)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if not source_path.exists():
        raise ValueError(f"Source file does not exist: {source}")

    # Validate size specifications
    for name, (width, height) in sizes.items():
        if not isinstance(width, int) or not isinstance(height, int):
            raise ValueError(f"Dimensions for variant '{name}' must be integers")
        if width <= 0 or height <= 0:
            raise ValueError(f"Dimensions for variant '{name}' must be positive")
        if width > 16384 or height > 16384:  # Common maximum image dimension limit
            raise ValueError(
                f"Dimensions for variant '{name}' exceed maximum allowed size (16384x16384)"
            )

    variants = {}
    try:
        with Image.open(source_path) as img:
            for name, (width, height) in sizes.items():
                variant_path = output_path / f"{source_path.stem}_{name}{source_path.suffix}"
                resized = img.resize((width, height), Image.Resampling.LANCZOS)

                if format.upper() == "WEBP":
                    variant_path = variant_path.with_suffix(".webp")
                    resized.save(str(variant_path), "WebP", quality=80)
                else:
                    resized.save(str(variant_path))

                variants[name] = str(variant_path)

        return variants

    except Exception as e:
        logging.error(f"Error creating size variants: {str(e)}")
        raise
