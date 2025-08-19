#!/usr/bin/env python3

import os
import sys
import json
import shutil
from PIL import Image
from pathlib import Path
import subprocess
from typing import Dict, List, Tuple, Optional

class AppStoreAssetGenerator:
    def __init__(self, base_dir: str = "app-store-assets"):
        self.base_dir = Path(base_dir)
        self.ios_dir = self.base_dir / "ios"
        self.android_dir = self.base_dir / "android"
        
        # Define required dimensions
        self.ios_icon_sizes = [
            (1024, 1024),  # App Store
            (180, 180),    # iPhone 6x
            (167, 167),    # iPad Pro
            (152, 152),    # iPad
            (120, 120),    # iPhone
            (87, 87),      # Settings 3x
            (80, 80),      # Spotlight 2x
            (76, 76),      # iPad 1x
            (60, 60),      # iPhone 1x
            (58, 58),      # Settings 2x
            (40, 40),      # Spotlight 1x
            (29, 29),      # Settings 1x
        ]
        
        self.android_icon_sizes = [
            (512, 512),    # Play Store
            (192, 192),    # High-res
            (144, 144),    # Large
            (96, 96),      # Medium
            (72, 72),      # Small
            (48, 48),      # Extra Small
        ]
        
        self.screenshot_sizes = {
            "ios": {
                "iphone_67": (1290, 2796),
                "iphone_65": (1242, 2688),
                "iphone_55": (1242, 2208),
                "ipad_pro_129": (2048, 2732),
                "ipad_pro_11": (1668, 2388),
            },
            "android": {
                "phone": (1080, 1920),
                "tablet_7": (1600, 2560),
                "tablet_10": (2048, 2732),
            }
        }

    def create_directory_structure(self) -> None:
        """Create the required directory structure if it doesn't exist."""
        for platform in ["ios", "android"]:
            for category in ["icons", "screenshots", "previews", "promotional"]:
                path = self.base_dir / platform / category
                path.mkdir(parents=True, exist_ok=True)

    def generate_icons(self, source_image: Path, platform: str) -> None:
        """Generate icons for the specified platform from source image."""
        if not source_image.exists():
            raise FileNotFoundError(f"Source image not found: {source_image}")

        sizes = self.ios_icon_sizes if platform == "ios" else self.android_icon_sizes
        output_dir = self.ios_dir / "icons" if platform == "ios" else self.android_dir / "icons"

        with Image.open(source_image) as img:
            for width, height in sizes:
                resized = img.resize((width, height), Image.Resampling.LANCZOS)
                output_path = output_dir / f"icon_{width}x{height}.png"
                resized.save(output_path, "PNG")
                print(f"Generated {platform} icon: {output_path}")

    def validate_screenshot(self, image_path: Path, required_size: Tuple[int, int]) -> bool:
        """Validate if a screenshot meets the required dimensions."""
        with Image.open(image_path) as img:
            width, height = img.size
            return (width, height) == required_size

    def process_video(self, video_path: Path, platform: str) -> bool:
        """Process and validate video according to platform requirements."""
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        try:
            # Get video information using ffprobe
            cmd = [
                "ffprobe",
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height,duration",
                "-of", "json",
                str(video_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            video_info = json.loads(result.stdout)
            
            # Extract dimensions and duration
            stream = video_info["streams"][0]
            width = int(stream["width"])
            height = int(stream["height"])
            duration = float(stream["duration"])
            
            # Check platform-specific requirements
            if platform == "ios":
                valid_dimensions = (width == 1080 and height == 1920) or (width == 1920 and height == 1080)
                valid_duration = 15 <= duration <= 30
            else:  # android
                valid_dimensions = width == 1920 and height == 1080
                valid_duration = 30 <= duration <= 120
            
            return valid_dimensions and valid_duration
            
        except subprocess.CalledProcessError as e:
            print(f"Error processing video: {e}")
            return False

    def validate_assets(self) -> Dict[str, List[str]]:
        """Validate all assets and return a list of issues."""
        issues = {
            "ios": [],
            "android": []
        }
        
        # Validate icons
        for platform in ["ios", "android"]:
            icon_dir = self.ios_dir / "icons" if platform == "ios" else self.android_dir / "icons"
            required_sizes = self.ios_icon_sizes if platform == "ios" else self.android_icon_sizes
            
            for width, height in required_sizes:
                icon_path = icon_dir / f"icon_{width}x{height}.png"
                if not icon_path.exists():
                    issues[platform].append(f"Missing {width}x{height} icon")
        
        # Validate screenshots
        for platform, sizes in self.screenshot_sizes.items():
            screenshot_dir = self.ios_dir / "screenshots" if platform == "ios" else self.android_dir / "screenshots"
            for device, dimensions in sizes.items():
                screenshots = list(screenshot_dir.glob(f"{device}_*.png"))
                if not screenshots:
                    issues[platform].append(f"Missing screenshots for {device}")
                for screenshot in screenshots:
                    if not self.validate_screenshot(screenshot, dimensions):
                        issues[platform].append(f"Invalid dimensions for {screenshot.name}")
        
        return issues

def main():
    generator = AppStoreAssetGenerator()
    
    # Create directory structure
    generator.create_directory_structure()
    
    # Example usage:
    try:
        # Generate icons if source image is provided
        if len(sys.argv) > 1:
            source_image = Path(sys.argv[1])
            generator.generate_icons(source_image, "ios")
            generator.generate_icons(source_image, "android")
        
        # Validate assets
        issues = generator.validate_assets()
        
        if any(issues.values()):
            print("\nValidation Issues:")
            for platform, platform_issues in issues.items():
                if platform_issues:
                    print(f"\n{platform.upper()} Issues:")
                    for issue in platform_issues:
                        print(f"- {issue}")
        else:
            print("\nAll assets are valid!")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 