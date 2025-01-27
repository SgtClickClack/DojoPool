from pathlib import Path
from PIL import Image
import logging
from typing import Dict, Any, List, Optional
import shutil
import os
import subprocess

logger = logging.getLogger(__name__)

# AVIF conversion quality settings
AVIF_QUALITY_SETTINGS = {
    'high': {
        'quality': 80,
        'speed': 4
    },
    'medium': {
        'quality': 65,
        'speed': 6
    },
    'low': {
        'quality': 50,
        'speed': 8
    }
}

def check_node() -> bool:
    """Check if Node.js is installed."""
    try:
        subprocess.run(['node', '--version'], capture_output=True)
        return True
    except FileNotFoundError:
        logger.error("Node.js not found. Please install Node.js from https://nodejs.org/")
        return False

def convert_to_avif(
    input_path: Path,
    output_path: Path,
    quality: str = 'high',
    fallback_formats: List[str] = ['webp', 'jpg']
) -> Dict[str, Path]:
    """Convert image to AVIF format with fallbacks."""
    try:
        settings = AVIF_QUALITY_SETTINGS[quality]
        
        # Create output directory if it doesn't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert to AVIF using Node.js script
        script_path = Path(__file__).parent / 'convert_to_avif.js'
        subprocess.run([
            'node',
            str(script_path),
            str(input_path),
            str(output_path),
            str(settings['quality']),
            str(settings['speed'])
        ], check=True)
        
        results = {'avif': output_path}
        
        # Generate fallback formats
        if 'webp' in fallback_formats:
            webp_path = output_path.with_suffix('.webp')
            with Image.open(input_path) as img:
                img.save(webp_path, 'WEBP', quality=settings['quality'])
            results['webp'] = webp_path
            
        if 'jpg' in fallback_formats:
            jpg_path = output_path.with_suffix('.jpg')
            with Image.open(input_path) as img:
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    background.save(jpg_path, 'JPEG', quality=settings['quality'])
                else:
                    img.save(jpg_path, 'JPEG', quality=settings['quality'])
            results['jpg'] = jpg_path
            
        return results
        
    except Exception as e:
        logger.error(f"Error converting {input_path} to AVIF: {str(e)}")
        return {}

def update_html_for_avif(html_file: Path) -> None:
    """Update HTML templates to include AVIF sources."""
    try:
        from bs4 import BeautifulSoup
        
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        modified = False
        for picture in soup.find_all('picture'):
            img = picture.find('img')
            if not img:
                continue
                
            src = img.get('src', '')
            if not src:
                continue
                
            # Check if AVIF version exists
            avif_path = Path('src/dojopool/static') / src.replace(
                Path(src).suffix, '.avif'
            ).lstrip('/')
            
            if avif_path.exists() and not picture.find('source', type='image/avif'):
                # Add AVIF source as first option
                avif_source = soup.new_tag('source')
                avif_source['type'] = 'image/avif'
                avif_source['srcset'] = str(avif_path).replace(
                    'src/dojopool/static/', ''
                )
                
                # Insert AVIF source before other sources
                first_source = picture.find('source')
                if first_source:
                    first_source.insert_before(avif_source)
                else:
                    picture.insert(0, avif_source)
                    
                modified = True
                
        if modified:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            logger.info(f"Updated AVIF support in {html_file}")
            
    except Exception as e:
        logger.error(f"Error updating {html_file} for AVIF: {str(e)}")

def process_images(
    image_dir: str = 'src/dojopool/static/images',
    quality: str = 'high'
) -> None:
    """Process all images in directory to add AVIF support."""
    if not check_node():
        return
        
    image_path = Path(image_dir)
    
    # Process each image
    for img_file in image_path.rglob('*'):
        if img_file.suffix.lower() in ('.jpg', '.jpeg', '.png'):
            # Skip if AVIF version exists and is newer
            avif_path = img_file.with_suffix('.avif')
            if avif_path.exists() and avif_path.stat().st_mtime > img_file.stat().st_mtime:
                continue
                
            logger.info(f"Converting {img_file} to AVIF")
            convert_to_avif(img_file, avif_path, quality)
            
    # Update HTML templates
    template_dir = Path('src/dojopool/templates')
    for html_file in template_dir.rglob('*.html'):
        update_html_for_avif(html_file)

if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Process images
    process_images() 