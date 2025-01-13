from flask import render_template, current_app
from pathlib import Path
from typing import Dict, Any
import os
from ..utils.image_processor import ImageProcessor

def get_file_size(file_path: Path) -> int:
    """Get the size of a file in bytes."""
    try:
        return os.path.getsize(file_path)
    except (OSError, FileNotFoundError):
        return 0

def game_page() -> str:
    """Render the game page with cache-busted image paths and size information."""
    # Initialize image processor with static directory paths
    static_dir = Path(str(current_app.static_folder))
    image_processor = ImageProcessor(
        input_dir=static_dir / 'images',
        output_dir=static_dir / 'images'
    )
    
    # Helper function to get image paths with sizes
    def get_image_info(relative_path: str) -> Dict[str, Any]:
        paths = image_processor.get_responsive_paths(relative_path)
        original_path = static_dir / relative_path
        
        # Get total size of all versions
        total_size = get_file_size(original_path)
        for size_key in paths:
            total_size += get_file_size(Path(paths[size_key]['webp']))
            total_size += get_file_size(Path(paths[size_key]['original']))
        
        return {**paths, 'size': total_size}
    
    # Get cache-busted paths and sizes for all images
    image_paths = {
        'PosterDojoPool': get_image_info('images/PosterDojoPool.jpg'),
        'features': {
            'geo': get_image_info('images/features/geo.jpg'),
            'avatar': get_image_info('images/features/avatar.jpg'),
            'tracking': get_image_info('images/features/tracking.jpg'),
            'rankings': get_image_info('images/features/rankings.jpg')
        }
    }
    
    return render_template('game.html', image_paths=image_paths) 