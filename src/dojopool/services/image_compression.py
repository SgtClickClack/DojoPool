from PIL import Image
import os
from typing import Tuple, Optional, Literal, Dict, Any, List, Union
import io
import logging
from concurrent.futures import ThreadPoolExecutor
from ..config.compression_config import DEFAULT_COMPRESSION_CONFIG

logger = logging.getLogger(__name__)

class ImageCompressionService:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the image compression service with configuration."""
        self.config = config if config is not None else DEFAULT_COMPRESSION_CONFIG
        
    def _calculate_new_dimensions(self, width: int, height: int, max_dimension: int) -> Tuple[int, int]:
        """Calculate new dimensions maintaining aspect ratio."""
        if width <= max_dimension and height <= max_dimension:
            return width, height
            
        aspect_ratio = width / height
        if width > height:
            new_width = max_dimension
            new_height = int(new_width / aspect_ratio)
        else:
            new_height = max_dimension
            new_width = int(new_height * aspect_ratio)
            
        return new_width, new_height
        
    def _compress_single_variant(self,
                               img: Image.Image,
                               variant_name: str,
                               variant_config: Dict[str, Any],
                               output_format: Literal['JPEG', 'WebP']) -> bytes:
        """Compress a single size variant of an image."""
        # Calculate new dimensions
        new_width, new_height = self._calculate_new_dimensions(
            img.width, img.height, variant_config['max_dimension']
        )
        
        # Create a copy of the image for this variant
        variant_img = img.copy()
        
        # Resize if needed
        if new_width != img.width or new_height != img.height:
            variant_img = variant_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert RGBA to RGB if JPEG output is requested
        if output_format == 'JPEG' and variant_img.mode == 'RGBA':
            background = Image.new('RGB', variant_img.size, (255, 255, 255))
            background.paste(variant_img, mask=variant_img.split()[3])
            variant_img = background
        
        # Prepare output buffer
        output_buffer = io.BytesIO()
        
        # Save with appropriate format and settings
        if output_format == 'JPEG':
            variant_img.save(output_buffer,
                           format='JPEG',
                           quality=variant_config['jpeg_quality'],
                           optimize=True)
        else:  # WebP
            variant_img.save(output_buffer,
                           format='WebP',
                           quality=variant_config['webp_quality'],
                           lossless=self.config['webp_lossless'],
                           method=6)
        
        return output_buffer.getvalue()
        
    def compress_image(self,
                      input_path: str,
                      output_dir: str,
                      filename: str) -> Dict[str, Dict[str, str]]:
        """
        Compress an image file with all configured size variants.
        
        Args:
            input_path: Path to the input image file
            output_dir: Base directory for output
            filename: Original filename without extension
            
        Returns:
            Dictionary of variant paths by format
        """
        result = {}
        
        try:
            with Image.open(input_path) as img:
                # Process each size variant
                for variant_name, variant_config in self.config['size_variants'].items():
                    result[variant_name] = {}
                    
                    # Create variant subdirectory if configured
                    if self.config['output_structure']['variant_subdir']:
                        variant_dir = os.path.join(output_dir, variant_name)
                    else:
                        variant_dir = output_dir
                    os.makedirs(variant_dir, exist_ok=True)
                    
                    # Process original format if keeping originals
                    if self.config['keep_original']:
                        output_path = os.path.join(variant_dir, f"{filename}.jpg")
                        compressed = self._compress_single_variant(img, variant_name, variant_config, 'JPEG')
                        with open(output_path, 'wb') as f:
                            f.write(compressed)
                        result[variant_name]['jpeg'] = output_path
                    
                    # Process WebP if enabled
                    if self.config['convert_to_webp']:
                        output_path = os.path.join(variant_dir, f"{filename}.webp")
                        compressed = self._compress_single_variant(img, variant_name, variant_config, 'WebP')
                        with open(output_path, 'wb') as f:
                            f.write(compressed)
                        result[variant_name]['webp'] = output_path
                
                return result
                
        except Exception as e:
            logger.error(f"Error compressing image {input_path}: {str(e)}")
            raise
            
    def _process_image_chunk(self, chunk: List[Tuple[str, str, str]]) -> List[Dict[str, Dict[str, str]]]:
        """Process a chunk of images."""
        results = []
        for input_path, output_dir, filename in chunk:
            try:
                result = self.compress_image(input_path, output_dir, filename)
                results.append(result)
                logger.info(f"Successfully compressed {filename}")
            except Exception as e:
                logger.error(f"Failed to compress {filename}: {str(e)}")
                results.append(None)
        return results

    def batch_compress_directory(self, input_dir: str, output_dir: str) -> List[Dict[str, Dict[str, str]]]:
        """
        Compress all images in a directory using parallel processing.
        
        Args:
            input_dir: Directory containing input images
            output_dir: Directory to save compressed images
            
        Returns:
            List of compression results for each image
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Collect all image files
        image_files = []
        for filename in os.listdir(input_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                input_path = os.path.join(input_dir, filename)
                base_filename = os.path.splitext(filename)[0]
                image_files.append((input_path, output_dir, base_filename))
        
        # Split into chunks
        chunks = [image_files[i:i + self.config['chunk_size']] 
                 for i in range(0, len(image_files), self.config['chunk_size'])]
        
        # Process chunks in parallel
        results = []
        with ThreadPoolExecutor(max_workers=self.config['max_threads']) as executor:
            chunk_results = list(executor.map(self._process_image_chunk, chunks))
            for chunk_result in chunk_results:
                results.extend(chunk_result)
        
        return results 