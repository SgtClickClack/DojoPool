from multiprocessing import Pool
from multiprocessing import Pool
"""
Automated performance testing suite for the image compression service.
Tests memory usage, processing speed, and compression quality.
"""

import logging
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import psutil
from PIL import Image

from .compression import ImageCompressionService

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Container for performance test results."""

    avg_memory_usage_mb: float
    peak_memory_usage_mb: float
    avg_processing_time_ms: float
    compression_ratio: float
    failed_images: int
    total_images: int
    memory_leak_detected: bool


class ImageCompressionPerformanceTester:
    """Performance testing suite for image compression service."""

    def __init__(self, compression_service: ImageCompressionService):
        """Initialize the performance tester."""
        self.compression_service = compression_service
        self.process = psutil.Process()

    def _generate_test_image(self, size: Tuple[int, int], color: bool = True) -> bytes:
        """Generate a test image of specified size."""
        mode = "RGB" if color else "L"
        channels = 3 if color else 1
        data = np.random.randint(0, 256, size=(*size, channels), dtype=np.uint8)
        image = Image.fromarray(data, mode)
        with tempfile.BytesIO() as bio:
            image.save(bio, format="PNG")
            return bio.getvalue()

    def _measure_memory_usage(self):
        """Get current memory usage in MB."""
        return self.process.memory_info().rss / (1024 * 1024)

    def _detect_memory_leak(self, memory_samples: List[float], threshold: float = 0.1):
        """
        Detect if there's a memory leak by analyzing memory usage pattern.
        Returns True if memory usage shows an upward trend exceeding the threshold.
        """
        if len(memory_samples) < 3:
            return False

        # Calculate the trend using linear regression
        x = np.arange(len(memory_samples))
        y = np.array(memory_samples)
        slope = np.polyfit(x, y, 1)[0]

        # Calculate the percentage increase
        total_increase = slope * len(memory_samples)
        initial_memory = memory_samples[0]
        percentage_increase = total_increase / initial_memory

        return percentage_increase > threshold

    def run_performance_test(
        self,
        num_images: int = 50,
        image_sizes: List[Tuple[int, int]] = None,
        chunk_sizes: List[int] = None,
    ) -> Dict[str, PerformanceMetrics]:
        """
        Run comprehensive performance tests on the image compression service.

        Args:
            num_images: Number of test images to process
            image_sizes: List of image sizes to test [(width, height), ...]
            chunk_sizes: List of chunk sizes to test

        Returns:
            Dictionary mapping test configurations to performance metrics
        """
        if image_sizes is None:
            image_sizes = [(800, 600), (1920, 1080), (3840, 2160)]
        if chunk_sizes is None:
            chunk_sizes = [5, 10, 20]

        results = {}

        # Create temporary directories
        with (
            tempfile.TemporaryDirectory() as input_dir,
            tempfile.TemporaryDirectory() as output_dir,
        ):
            input_path = Path(input_dir)
            output_path = Path(output_dir)

            # Test each combination of image size and chunk size
            for size in image_sizes:
                for chunk_size in chunk_sizes:
                    test_name = f"size_{size[0]}x{size[1]}_chunk_{chunk_size}"
                    logger.info(f"Running test: {test_name}")

                    # Generate test images
                    total_size = 0
                    for i in range(num_images):
                        image_data = self._generate_test_image(size)
                        total_size += len(image_data)
                        with open(input_path / f"test_{i}.png", "wb") as f:
                            f.write(image_data)

                    # Measure performance
                    memory_samples = []
                    start_time = time.time()
                    self._measure_memory_usage()

                    try:
                        # Process images
                        result = self.compression_service.batch_compress_directory(
                            str(input_path), str(output_path), chunk_size=chunk_size
                        )

                        # Calculate metrics
                        end_time = time.time()
                        final_memory = self._measure_memory_usage()
                        memory_samples.append(final_memory)

                        processing_time = (end_time - start_time) * 1000 / num_images
                        compression_ratio = 1 - (result.total_output_size / total_size)

                        metrics = PerformanceMetrics(
                            avg_memory_usage_mb=sum(memory_samples)
                            / len(memory_samples),
                            peak_memory_usage_mb=max(memory_samples),
                            avg_processing_time_ms=processing_time,
                            compression_ratio=compression_ratio,
                            failed_images=len(result.failed),
                            total_images=num_images,
                            memory_leak_detected=self._detect_memory_leak(
                                memory_samples
                            ),
                        )

                        results[test_name] = metrics

                        # Log results
                        logger.info(f"Test {test_name} completed:")
                        logger.info(
                            f"  Average memory usage: {metrics.avg_memory_usage_mb:.2f} MB"
                        )
                        logger.info(
                            f"  Peak memory usage: {metrics.peak_memory_usage_mb:.2f} MB"
                        )
                        logger.info(
                            f"  Average processing time: {metrics.avg_processing_time_ms:.2f} ms"
                        )
                        logger.info(
                            f"  Compression ratio: {metrics.compression_ratio:.2%}"
                        )
                        logger.info(
                            f"  Failed images: {metrics.failed_images}/{metrics.total_images}"
                        )
                        logger.info(
                            f"  Memory leak detected: {metrics.memory_leak_detected}"
                        )

                    except Exception as e:
                        logger.error(f"Test {test_name} failed: {str(e)}")
                        continue

                    finally:
                        # Cleanup
                        for file in input_path.glob("*"):
                            file.unlink()
                        for file in output_path.glob("*"):
                            file.unlink()

        return results

    def benchmark_memory_usage(
        self,
        duration_seconds: int = 300,
        image_size: Tuple[int, int] = (1920, 1080),
        chunk_size: int = 10,
    ) -> Dict[str, float]:
        """
        Run a long-duration memory usage benchmark.

        Args:
            duration_seconds: How long to run the benchmark
            image_size: Size of test images
            chunk_size: Number of images per chunk

        Returns:
            Dictionary with memory usage statistics
        """
        logger.info(f"Starting memory benchmark for {duration_seconds} seconds")

        with (
            tempfile.TemporaryDirectory() as input_dir,
            tempfile.TemporaryDirectory() as output_dir,
        ):
            input_path = Path(input_dir)
            output_path = Path(output_dir)

            memory_samples = []
            start_time = time.time()
            iteration = 0

            try:
                while time.time() - start_time < duration_seconds:
                    # Generate new test images
                    for i in range(chunk_size):
                        image_data = self._generate_test_image(image_size)
                        with open(input_path / f"test_{i}.png", "wb") as f:
                            f.write(image_data)

                    # Process images and measure memory
                    self._measure_memory_usage()
                    self.compression_service.batch_compress_directory(
                        str(input_path), str(output_path), chunk_size=chunk_size
                    )
                    memory_after = self._measure_memory_usage()
                    memory_samples.append(memory_after)

                    # Cleanup
                    for file in input_path.glob("*"):
                        file.unlink()
                    for file in output_path.glob("*"):
                        file.unlink()

                    # Force garbage collection
                    import gc

                    gc.collect()

                    iteration += 1
                    if iteration % 5 == 0:
                        logger.info(
                            f"Completed {iteration} iterations. Current memory: {memory_after:.2f} MB"
                        )

                # Calculate statistics
                memory_leak = self._detect_memory_leak(memory_samples)

                return {
                    "min_memory_mb": min(memory_samples),
                    "max_memory_mb": max(memory_samples),
                    "avg_memory_mb": sum(memory_samples) / len(memory_samples),
                    "memory_leak_detected": memory_leak,
                    "iterations_completed": iteration,
                }

            except Exception as e:
                logger.error(f"Memory benchmark failed: {str(e)}")
                return {}
