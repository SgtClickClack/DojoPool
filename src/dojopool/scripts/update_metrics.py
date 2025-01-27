import json
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def scan_templates_for_image_usage(template_dir: str = 'src/dojopool/templates') -> Dict[str, Dict[str, bool]]:
    """Scan templates to determine image usage patterns."""
    image_usage = {}
    template_path = Path(template_dir)
    
    for html_file in template_path.rglob('*.html'):
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
            
            for img in soup.find_all('img'):
                src = img.get('src', '')
                if not src:
                    continue
                    
                # Extract image filename from src
                filename = Path(src).name
                
                if filename not in image_usage:
                    image_usage[filename] = {
                        'has_lazy_loading': False,
                        'has_responsive': False,
                        'has_webp': False,
                        'has_avif': False,
                        'preloaded': False
                    }
                
                # Check lazy loading
                loading = img.get('loading')
                if loading == 'lazy':
                    image_usage[filename]['has_lazy_loading'] = True
                elif loading == 'eager':
                    image_usage[filename]['preloaded'] = True
                
                # Check responsive and formats
                picture = img.find_parent('picture')
                if picture:
                    image_usage[filename]['has_responsive'] = True
                    # Check WebP
                    webp_source = picture.find('source', type='image/webp')
                    if webp_source:
                        image_usage[filename]['has_webp'] = True
                    # Check AVIF
                    avif_source = picture.find('source', type='image/avif')
                    if avif_source:
                        image_usage[filename]['has_avif'] = True
                        
        except Exception as e:
            logger.error(f"Error processing {html_file}: {str(e)}")
    
    return image_usage

def update_performance_metrics(metrics_file: str = 'performance_metrics.json') -> None:
    """Update performance metrics with current image usage data."""
    try:
        # Get current image usage
        image_usage = scan_templates_for_image_usage()
        
        # Calculate metrics
        total_images = len(image_usage)
        lazy_loading_count = sum(1 for data in image_usage.values() if data['has_lazy_loading'])
        responsive_count = sum(1 for data in image_usage.values() if data['has_responsive'])
        webp_count = sum(1 for data in image_usage.values() if data['has_webp'])
        avif_count = sum(1 for data in image_usage.values() if data['has_avif'])
        preloaded_count = sum(1 for data in image_usage.values() if data['preloaded'])
        
        # Load existing metrics
        try:
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
        except FileNotFoundError:
            metrics = []
        
        # Create new metrics entry
        new_metrics = {
            "timestamp": datetime.now().isoformat(),
            "total_images": total_images,
            "lazy_loading_rate": lazy_loading_count / total_images if total_images > 0 else 0,
            "responsive_image_rate": responsive_count / total_images if total_images > 0 else 0,
            "webp_adoption_rate": webp_count / total_images if total_images > 0 else 0,
            "avif_adoption_rate": avif_count / total_images if total_images > 0 else 0,
            "preloaded_images": preloaded_count,
            "metrics_by_image": {
                filename: {
                    "has_lazy_loading": data["has_lazy_loading"],
                    "has_responsive": data["has_responsive"],
                    "has_webp": data["has_webp"],
                    "has_avif": data["has_avif"],
                    "preloaded": data["preloaded"]
                }
                for filename, data in image_usage.items()
            }
        }
        
        # Add new metrics to the list
        metrics.append(new_metrics)
        
        # Save updated metrics
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
            
        logger.info(f"Updated performance metrics in {metrics_file}")
        logger.info(f"Lazy loading rate: {new_metrics['lazy_loading_rate']:.2%}")
        logger.info(f"WebP adoption rate: {new_metrics['webp_adoption_rate']:.2%}")
        logger.info(f"AVIF adoption rate: {new_metrics['avif_adoption_rate']:.2%}")
        logger.info(f"Responsive image rate: {new_metrics['responsive_image_rate']:.2%}")
        logger.info(f"Preloaded images: {new_metrics['preloaded_images']}")
        
    except Exception as e:
        logger.error(f"Error updating metrics: {str(e)}")

if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Update metrics
    update_performance_metrics() 