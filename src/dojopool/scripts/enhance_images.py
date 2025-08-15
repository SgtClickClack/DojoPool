import logging
import os
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from PIL import Image as PILImage
from tqdm import tqdm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ImageBreakpoint:
    width: int
    quality: int
    art_direction: Optional[str] = None  # Crop/focus point for art direction


BREAKPOINTS = [
    ImageBreakpoint(640, 80),  # sm
    ImageBreakpoint(768, 85),  # md
    ImageBreakpoint(1024, 85),  # lg
    ImageBreakpoint(1280, 90),  # xl
    ImageBreakpoint(1536, 90),  # 2xl
]

CRITICAL_PATHS = {
    "hero": ["header", "landing"],
    "product": ["thumbnail", "preview"],
    "profile": ["avatar"],
}


class ResponsiveImageGenerator:
    def __init__(self, quality: int = 85, max_threads: int = 4):
        self.quality = quality
        self.max_threads = max_threads
        self.stats = {"processed": 0, "bytes_saved": 0, "errors": 0}

    def _get_image_format(self, img: PILImage.Image) -> str:
        """Detect and return optimal format for image."""
        if img.mode == "RGBA" or self._has_transparency(img):
            return "PNG"
        return "JPEG"

    def _has_transparency(self, img: PILImage.Image) -> bool:
        """Check if image has transparency."""
        if img.info.get("transparency", None) is not None:
            return True
        if img.mode == "P":
            return "transparency" in img.info
        return img.mode == "RGBA"

    def _create_responsive_version(
        self,
        img: PILImage.Image,
        breakpoint: ImageBreakpoint,
        output_path: str,
        original_format: str,
    ) -> Tuple[str, int]:
        """Create a responsive version of the image for a specific breakpoint."""
        # Calculate new dimensions maintaining aspect ratio
        ratio = breakpoint.width / img.size[0]
        new_height = int(img.size[1] * ratio)
        new_size = (breakpoint.width, new_height)

        # Apply art direction if specified
        if breakpoint.art_direction:
            # TODO: Implement art direction based on specified crop/focus
            pass

        # Resize image
        resized = img.resize(new_size, PILImage.Resampling.LANCZOS)

        # Save original format
        orig_path = f"{output_path}_{breakpoint.width}w.{original_format.lower()}"
        resized.save(orig_path, format=original_format, quality=breakpoint.quality, optimize=True)
        orig_size = os.path.getsize(orig_path)

        # Save WebP version
        webp_path = f"{output_path}_{breakpoint.width}w.webp"
        resized.save(webp_path, format="WEBP", quality=breakpoint.quality, method=6)
        webp_size = os.path.getsize(webp_path)

        return webp_path if webp_size < orig_size else orig_path, min(orig_size, webp_size)

    def create_responsive_images(self, input_path: str, output_dir: str) -> Dict[str, str]:
        """Generate responsive versions of an image."""
        try:
            with PILImage.open(input_path) as img:
                # Determine optimal format
                format = self._get_image_format(img)

                # Get original file size
                original_size = os.path.getsize(input_path)

                # Create output directory if needed
                os.makedirs(output_dir, exist_ok=True)

                # Generate base output path
                filename = os.path.splitext(os.path.basename(input_path))[0]
                output_path = os.path.join(output_dir, filename)

                # Generate responsive versions
                responsive_paths = {}
                total_size = 0

                for breakpoint in BREAKPOINTS:
                    path, size = self._create_responsive_version(
                        img, breakpoint, output_path, format
                    )
                    responsive_paths[str(breakpoint.width)] = path
                    total_size += size

                # Update statistics
                self.stats["processed"] += 1
                self.stats["bytes_saved"] += max(0, original_size - total_size)

                return responsive_paths

        except Exception as e:
            logger.error(f"Error processing {input_path}: {str(e)}")
            self.stats["errors"] += 1
            return {}

    def batch_process(self, input_dir: str, output_dir: str) -> None:
        """Process all images in a directory with progress tracking."""
        image_files = [
            f
            for f in os.listdir(input_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
        ]

        with ThreadPoolExecutor(max_workers=self.max_threads) as executor:
            futures = []
            for filename in image_files:
                input_path = os.path.join(input_dir, filename)
                futures.append(
                    executor.submit(self.create_responsive_images, input_path, output_dir)
                )

            for future in tqdm(futures, desc="Processing images"):
                future.result()

        logger.info(
            f"Processing complete. Processed: {self.stats['processed']}, "
            f"Errors: {self.stats['errors']}, "
            f"Bytes saved: {self.stats['bytes_saved']:,}"
        )

    def add_responsive_loading(self, html_file: str) -> None:
        """Enhance HTML with responsive image loading."""
        try:
            with open(html_file, "r") as f:
                content = f.read()

            # Find all img tags
            import re

            img_tags = re.finditer(r'<img[^>]+src="([^"]+)"[^>]*>', content)

            for match in img_tags:
                img_tag = match.group(0)
                src = match.group(1)

                # Skip if already processed
                if "<picture" in img_tag:
                    continue

                # Determine if image is critical
                is_critical = any(
                    path in src.lower() for paths in CRITICAL_PATHS.values() for path in paths
                )

                # Generate picture element
                filename = os.path.splitext(os.path.basename(src))[0]
                picture_tag = "<picture>\n"

                # Add source elements for each breakpoint
                for breakpoint in reversed(BREAKPOINTS):
                    webp_src = f"{filename}_{breakpoint.width}w.webp"
                    orig_src = f"{filename}_{breakpoint.width}w.{os.path.splitext(src)[1][1:]}"

                    media_query = f"(min-width: {breakpoint.width}px)"
                    picture_tag += (
                        f'  <source media="{media_query}" srcset="{webp_src}" type="image/webp">\n'
                    )
                    picture_tag += f'  <source media="{media_query}" srcset="{orig_src}">\n'

                # Add img tag with modifications
                new_img_tag = img_tag.replace(
                    "<img", '<img loading="eager"' if is_critical else '<img loading="lazy"'
                )
                picture_tag += f"  {new_img_tag}\n</picture>"

                # Replace original img tag
                content = content.replace(img_tag, picture_tag)

            # Save modified content
            with open(html_file, "w") as f:
                f.write(content)

        except Exception as e:
            logger.error(f"Error processing HTML file {html_file}: {str(e)}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Generate responsive images and update HTML")
    parser.add_argument("input_dir", help="Input directory containing images")
    parser.add_argument("output_dir", help="Output directory for responsive images")
    parser.add_argument("--html-dir", help="Directory containing HTML files to update")
    parser.add_argument("--quality", type=int, default=85, help="Base quality for compression")
    parser.add_argument("--threads", type=int, default=4, help="Number of worker threads")

    args = parser.parse_args()

    generator = ResponsiveImageGenerator(quality=args.quality, max_threads=args.threads)

    # Process images
    generator.batch_process(args.input_dir, args.output_dir)

    # Update HTML files if specified
    if args.html_dir:
        for filename in os.listdir(args.html_dir):
            if filename.endswith(".html"):
                html_file = os.path.join(args.html_dir, filename)
                generator.add_responsive_loading(html_file)


if __name__ == "__main__":
    main()
