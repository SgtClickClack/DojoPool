import logging
import os
from io import BytesIO
from typing import Optional

from PIL import Image as PILImage

# Try to import piexif, but don't fail if not available
try:
    import piexif

    HAS_PIEXIF = True
except ImportError:
    HAS_PIEXIF = False
    logging.warning("piexif not installed - EXIF data will not be preserved")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImageOptimizer:
    def __init__(self, quality: int = 85, max_size: int = 1920, keep_exif: bool = True):
        self.quality = quality
        self.max_size = max_size
        self.keep_exif = keep_exif and HAS_PIEXIF
        self.stats = {"processed": 0, "bytes_saved": 0, "errors": 0}

    def _extract_exif(self, img: PILImage.Image) -> Optional[bytes]:
        """Extract EXIF data from image if available and enabled."""
        if not self.keep_exif or not HAS_PIEXIF:
            return None
        try:
            exif_dict = piexif.load(img.info.get("exif", b""))
            return piexif.dump(exif_dict)
        except:
            return None

    def optimize_image(self, input_path: str, output_path: str) -> bool:
        """Optimize a single image with error handling and statistics tracking."""
        try:
            with PILImage.open(input_path) as img:
                # Extract EXIF before any modifications
                exif_bytes = self._extract_exif(img)

                # Calculate new dimensions while maintaining aspect ratio
                ratio = min(self.max_size / max(img.size), 1.0)
                new_width = int(img.size[0] * ratio)
                new_height = int(img.size[1] * ratio)
                new_size = (new_width, new_height)

                if ratio < 1.0:
                    img = img.resize(new_size, PILImage.Resampling.LANCZOS)

                # Save optimized image
                save_args = {"quality": self.quality, "optimize": True}

                if exif_bytes:
                    save_args["exif"] = exif_bytes

                # Get original file size
                original_size = os.path.getsize(input_path)

                # Save to BytesIO first to check optimized size
                buffer = BytesIO()
                img.save(buffer, format=img.format, **save_args)
                optimized_size = len(buffer.getvalue())

                # Only save if we achieved compression
                if optimized_size < original_size:
                    img.save(output_path, **save_args)
                    self.stats["bytes_saved"] += original_size - optimized_size
                else:
                    # If no compression achieved, copy original
                    img.save(output_path, **save_args)

                self.stats["processed"] += 1
                return True

        except Exception as e:
            logger.error(f"Error optimizing {input_path}: {str(e)}")
            self.stats["errors"] += 1
            return False

    def batch_optimize(self, input_dir: str, output_dir: str) -> None:
        """Optimize all images in a directory."""
        os.makedirs(output_dir, exist_ok=True)

        for filename in os.listdir(input_dir):
            if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                input_path = os.path.join(input_dir, filename)
                output_path = os.path.join(output_dir, filename)
                self.optimize_image(input_path, output_path)

        logger.info(
            f"Optimization complete. Processed: {self.stats['processed']}, "
            f"Errors: {self.stats['errors']}, "
            f"Bytes saved: {self.stats['bytes_saved']:,}"
        )


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Optimize images while preserving EXIF data")
    parser.add_argument("input_dir", help="Input directory containing images")
    parser.add_argument("output_dir", help="Output directory for optimized images")
    parser.add_argument("--quality", type=int, default=85, help="JPEG quality (1-100)")
    parser.add_argument("--max-size", type=int, default=1920, help="Maximum dimension")
    parser.add_argument("--keep-exif", action="store_true", help="Preserve EXIF data")

    args = parser.parse_args()

    optimizer = ImageOptimizer(
        quality=args.quality, max_size=args.max_size, keep_exif=args.keep_exif
    )

    optimizer.batch_optimize(args.input_dir, args.output_dir)


if __name__ == "__main__":
    main()
