"""
Memory-efficient batch image processor.
"""

from typing import List, Dict, Any, Iterator, Optional
from pathlib import Path
import logging
import gc
import weakref
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from .compression import ImageCompressionService, CompressionConfig, ImageFormat

logger = logging.getLogger(__name__)

@dataclass
class BatchProcessingResult:
    """Result of batch image processing."""
    total_processed: int
    successful: int
    failed: int
    total_size_before: int
    total_size_after: int
    errors: List[Dict[str, Any]]

class BatchImageProcessor:
    """Memory-efficient batch image processor."""
    
    def __init__(
        self,
        compression_service: ImageCompressionService,
        max_workers: int = 4,
        chunk_size: int = 10,
        max_memory_mb: int = 1024  # 1GB default limit
    ):
        self._compression_service = compression_service
        self._max_workers = max_workers
        self._chunk_size = chunk_size
        self._max_memory_bytes = max_memory_mb * 1024 * 1024
        self._cache = weakref.WeakValueDictionary()  # Cache with weak references
    
    def process_directory(
        self,
        input_dir: Path,
        output_dir: Path,
        config: CompressionConfig,
        recursive: bool = True
    ) -> BatchProcessingResult:
        """
        Process all images in a directory.
        
        Uses chunking and weak references to manage memory usage.
        """
        # Initialize result
        result = BatchProcessingResult(
            total_processed=0,
            successful=0,
            failed=0,
            total_size_before=0,
            total_size_after=0,
            errors=[]
        )
        
        try:
            # Create output directory if it doesn't exist
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Get all image files
            pattern = '**/*' if recursive else '*'
            image_files = [
                f for f in input_dir.glob(pattern)
                if f.is_file() and self._is_image_file(f)
            ]
            
            # Process in chunks to manage memory
            for chunk in self._chunk_iterator(image_files):
                self._process_chunk(chunk, output_dir, config, result)
                
                # Force garbage collection between chunks
                gc.collect()
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing directory: {str(e)}")
            result.errors.append({
                'type': 'directory_error',
                'message': str(e)
            })
            return result
    
    def _process_chunk(
        self,
        files: List[Path],
        output_dir: Path,
        config: CompressionConfig,
        result: BatchProcessingResult
    ) -> None:
        """Process a chunk of files in parallel."""
        with ThreadPoolExecutor(max_workers=self._max_workers) as executor:
            # Submit all tasks
            future_to_file = {
                executor.submit(
                    self._process_single_file,
                    input_file,
                    output_dir,
                    config
                ): input_file
                for input_file in files
            }
            
            # Process completed tasks
            for future in as_completed(future_to_file):
                input_file = future_to_file[future]
                try:
                    success, size_before, size_after = future.result()
                    result.total_processed += 1
                    if success:
                        result.successful += 1
                        result.total_size_before += size_before
                        result.total_size_after += size_after
                    else:
                        result.failed += 1
                except Exception as e:
                    result.failed += 1
                    result.errors.append({
                        'file': str(input_file),
                        'error': str(e)
                    })
    
    def _process_single_file(
        self,
        input_file: Path,
        output_dir: Path,
        config: CompressionConfig
    ) -> tuple[bool, int, int]:
        """
        Process a single image file.
        
        Returns:
            Tuple of (success, size_before, size_after)
        """
        try:
            # Check if result is in cache
            cache_key = (str(input_file), str(config))
            if cache_key in self._cache:
                return self._cache[cache_key]
            
            # Read input file
            size_before = input_file.stat().st_size
            with open(input_file, 'rb') as f:
                image_data = f.read()
            
            # Compress image
            compressed_data, mime_type = self._compression_service.compress_image(
                image_data,
                config
            )
            
            # Determine output path
            relative_path = input_file.relative_to(input_file.parent)
            output_path = output_dir / relative_path.with_suffix(
                self._get_extension_for_format(config.format)
            )
            
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write output file
            with open(output_path, 'wb') as f:
                f.write(compressed_data)
            
            size_after = len(compressed_data)
            
            # Cache result with weak reference
            result = (True, size_before, size_after)
            self._cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing file {input_file}: {str(e)}")
            return False, 0, 0
    
    def _chunk_iterator(self, items: List[Any]) -> Iterator[List[Any]]:
        """Iterate over items in chunks."""
        for i in range(0, len(items), self._chunk_size):
            yield items[i:i + self._chunk_size]
    
    def _is_image_file(self, path: Path) -> bool:
        """Check if a file is an image based on extension."""
        return path.suffix.lower() in {
            '.jpg', '.jpeg', '.png', '.webp',
            '.avif', '.gif', '.bmp', '.tiff'
        }
    
    def _get_extension_for_format(self, format: ImageFormat) -> str:
        """Get file extension for image format."""
        extensions = {
            ImageFormat.JPEG: '.jpg',
            ImageFormat.PNG: '.png',
            ImageFormat.WEBP: '.webp',
            ImageFormat.AVIF: '.avif'
        }
        return extensions.get(format, '.jpg') 