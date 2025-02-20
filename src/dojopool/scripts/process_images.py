#!/usr/bin/env python3
import argparse
import logging
import sys
from pathlib import Path

from ..utils.image_processor import ImageProcessor


def setup_logging(verbose: bool = False):
    """Configure logging based on verbosity level."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def main():
    parser = argparse.ArgumentParser(description="Process images for web optimization")
    parser.add_argument("input_dir", help="Directory containing images to process")
    parser.add_argument(
        "--output-dir",
        "-o",
        default="static/images",
        help="Output directory for processed images (default: static/images)",
    )
    parser.add_argument(
        "--quality",
        "-q",
        type=int,
        default=80,
        help="Quality setting for image compression (0-100, default: 80)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose logging"
    )

    args = parser.parse_args()
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)

    try:
        # Convert paths to absolute
        input_dir = Path(args.input_dir).resolve()
        output_dir = Path(args.output_dir).resolve()

        if not input_dir.exists():
            logger.error(f"Input directory does not exist: {input_dir}")
            return 1

        # Create processor and process images
        processor = ImageProcessor(str(input_dir), str(output_dir))
        results = processor.process_directory(quality=args.quality)

        # Log results
        total_webp = len(results["webp"])
        total_optimized = len(results["optimized"])
        successful_webp = sum(1 for r in results["webp"] if r.success)
        successful_optimized = sum(1 for r in results["optimized"] if r.success)

        logger.info("Processing complete!")
        logger.info(f"WebP conversions: {successful_webp}/{total_webp} successful")
        logger.info(
            f"Optimized images: {successful_optimized}/{total_optimized} successful"
        )

        # Calculate average compression ratios for successful conversions
        webp_ratios = [
            r.compression_ratio
            for r in results["webp"]
            if r.success and r.compression_ratio
        ]
        opt_ratios = [
            r.compression_ratio
            for r in results["optimized"]
            if r.success and r.compression_ratio
        ]

        if webp_ratios:
            avg_webp_ratio = sum(webp_ratios) / len(webp_ratios)
            logger.info(f"Average WebP compression ratio: {avg_webp_ratio:.2%}")

        if opt_ratios:
            avg_opt_ratio = sum(opt_ratios) / len(opt_ratios)
            logger.info(f"Average optimization compression ratio: {avg_opt_ratio:.2%}")

        # Check for any failures
        failed_webp = [r for r in results["webp"] if not r.success]
        failed_optimized = [r for r in results["optimized"] if not r.success]

        if failed_webp or failed_optimized:
            logger.warning("Some images failed to process:")
            for result in failed_webp:
                logger.warning(f"WebP conversion failed: {result.error}")
            for result in failed_optimized:
                logger.warning(f"Optimization failed: {result.error}")
            return 1

        return 0

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
