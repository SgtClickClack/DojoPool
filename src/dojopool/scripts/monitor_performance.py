import os
import json
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_performance.log'),
        logging.StreamHandler()
    ]
)

@dataclass
class ImageMetrics:
    """Metrics for a single image."""
    path: str
    original_size: int
    optimized_size: int
    webp_size: Optional[int]
    width: int
    height: int
    format: str
    has_responsive: bool
    has_webp: bool
    has_lazy_loading: bool
    preloaded: bool
    last_modified: str

@dataclass
class PerformanceSnapshot:
    """Performance snapshot at a point in time."""
    timestamp: str
    total_images: int
    total_original_size: int
    total_optimized_size: int
    total_webp_size: int
    webp_adoption_rate: float
    lazy_loading_rate: float
    responsive_image_rate: float
    preloaded_images: int
    metrics_by_image: Dict[str, ImageMetrics]

class PerformanceMonitor:
    def __init__(self):
        """Initialize the performance monitor."""
        self.base_path = Path('src/dojopool/static/images')
        self.metrics_file = Path('performance_metrics.json')
        self.history: List[PerformanceSnapshot] = []
        self.load_history()

    def load_history(self):
        """Load performance history from file."""
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                data = json.load(f)
                self.history = [PerformanceSnapshot(**snapshot) for snapshot in data]

    def save_history(self):
        """Save performance history to file."""
        with open(self.metrics_file, 'w') as f:
            data = [asdict(snapshot) for snapshot in self.history]
            json.dump(data, f, indent=2)

    def collect_image_metrics(self) -> Dict[str, ImageMetrics]:
        """Collect metrics for all images."""
        metrics = {}
        for image_path in self.base_path.rglob('*'):
            if not image_path.is_file() or not image_path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                continue

            rel_path = str(image_path.relative_to(self.base_path))
            base_path = image_path.parent / image_path.stem

            # Check for optimized and WebP versions
            optimized_path = base_path.with_name(f"{image_path.stem}_optimized{image_path.suffix}")
            webp_path = base_path.with_suffix('.webp')

            # Check for responsive versions
            has_responsive = any(p.name.startswith(f"{image_path.stem}_") for p in image_path.parent.glob(f"{image_path.stem}_*"))

            # Get image info
            try:
                from PIL import Image
                with Image.open(image_path) as img:
                    width, height = img.size
                    format = img.format or 'UNKNOWN'
            except Exception as e:
                logging.error(f"Error reading image {rel_path}: {e}")
                continue

            metrics[rel_path] = ImageMetrics(
                path=rel_path,
                original_size=image_path.stat().st_size,
                optimized_size=optimized_path.stat().st_size if optimized_path.exists() else image_path.stat().st_size,
                webp_size=webp_path.stat().st_size if webp_path.exists() else None,
                width=width,
                height=height,
                format=format,
                has_responsive=has_responsive,
                has_webp=webp_path.exists(),
                has_lazy_loading=self._check_lazy_loading(rel_path),
                preloaded=self._check_preloaded(rel_path),
                last_modified=datetime.fromtimestamp(image_path.stat().st_mtime).isoformat()
            )

        return metrics

    def _check_lazy_loading(self, image_path: str) -> bool:
        """Check if an image has lazy loading in templates."""
        templates_dir = Path('src/dojopool/templates')
        image_name = Path(image_path).name
        
        for html_file in templates_dir.rglob('*.html'):
            try:
                content = html_file.read_text()
                if image_name in content and 'loading="lazy"' in content:
                    return True
            except Exception as e:
                logging.error(f"Error reading template {html_file}: {e}")
        
        return False

    def _check_preloaded(self, image_path: str) -> bool:
        """Check if an image is preloaded in templates."""
        templates_dir = Path('src/dojopool/templates')
        image_name = Path(image_path).name
        
        for html_file in templates_dir.rglob('*.html'):
            try:
                content = html_file.read_text()
                if image_name in content and 'rel="preload"' in content:
                    return True
            except Exception as e:
                logging.error(f"Error reading template {html_file}: {e}")
        
        return False

    def create_snapshot(self) -> PerformanceSnapshot:
        """Create a performance snapshot."""
        metrics = self.collect_image_metrics()
        
        total_original = sum(m.original_size for m in metrics.values())
        total_optimized = sum(m.optimized_size for m in metrics.values())
        total_webp = sum(m.webp_size or 0 for m in metrics.values())
        
        webp_rate = sum(1 for m in metrics.values() if m.has_webp) / len(metrics) if metrics else 0
        lazy_rate = sum(1 for m in metrics.values() if m.has_lazy_loading) / len(metrics) if metrics else 0
        responsive_rate = sum(1 for m in metrics.values() if m.has_responsive) / len(metrics) if metrics else 0
        preloaded = sum(1 for m in metrics.values() if m.preloaded)

        return PerformanceSnapshot(
            timestamp=datetime.now().isoformat(),
            total_images=len(metrics),
            total_original_size=total_original,
            total_optimized_size=total_optimized,
            total_webp_size=total_webp,
            webp_adoption_rate=webp_rate,
            lazy_loading_rate=lazy_rate,
            responsive_image_rate=responsive_rate,
            preloaded_images=preloaded,
            metrics_by_image=metrics
        )

    def analyze_trends(self):
        """Analyze performance trends."""
        if not self.history:
            logging.info("No historical data available for trend analysis")
            return

        latest = self.history[-1]
        logging.info("\nPerformance Analysis:")
        logging.info(f"Total Images: {latest.total_images}")
        logging.info(f"Original Size: {latest.total_original_size / 1024 / 1024:.2f} MB")
        logging.info(f"Optimized Size: {latest.total_optimized_size / 1024 / 1024:.2f} MB")
        logging.info(f"WebP Size: {latest.total_webp_size / 1024 / 1024:.2f} MB")
        logging.info(f"Space Saved: {(latest.total_original_size - latest.total_optimized_size) / 1024 / 1024:.2f} MB")
        logging.info(f"WebP Adoption: {latest.webp_adoption_rate * 100:.1f}%")
        logging.info(f"Lazy Loading: {latest.lazy_loading_rate * 100:.1f}%")
        logging.info(f"Responsive Images: {latest.responsive_image_rate * 100:.1f}%")
        logging.info(f"Preloaded Images: {latest.preloaded_images}")

    def update_metrics(self):
        """Update performance metrics."""
        snapshot = self.create_snapshot()
        self.history.append(snapshot)
        self.save_history()
        self.analyze_trends()

def main():
    monitor = PerformanceMonitor()
    monitor.update_metrics()

if __name__ == '__main__':
    main() 