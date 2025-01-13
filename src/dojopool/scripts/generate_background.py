from PIL import Image, ImageDraw, ImageFilter
import random
from pathlib import Path
import colorsys

def create_cyber_background(width=1920, height=1080):
    # Create pure black background
    image = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Generate grid lines with precise neon green color - much lower opacity
    grid_color = (0, 255, 157, 5)  # Reduced opacity to 5
    grid_spacing = 40
    
    # Horizontal lines
    for y in range(0, height, grid_spacing):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)
    
    # Vertical lines
    for x in range(0, width, grid_spacing):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    
    # Add very subtle glow at intersections
    for x in range(0, width, grid_spacing):
        for y in range(0, height, grid_spacing):
            radius = 3  # Smaller radius
            glow = Image.new('RGBA', (radius * 2, radius * 2), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow)
            
            # Draw small glow at intersection
            for r in range(radius, 0, -1):
                opacity = int((r / radius) * 3)  # Much lower opacity
                glow_draw.ellipse([radius - r, radius - r, radius + r, radius + r],
                                fill=(0, 255, 157, opacity))
            
            glow = glow.filter(ImageFilter.GaussianBlur(1))  # Less blur
            image.paste(glow, (x - radius, y - radius), glow)
    
    return image

def main():
    # Create output directory if it doesn't exist
    output_dir = Path('src/dojopool/static/images/backgrounds')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate and save background
    bg = create_cyber_background()
    
    # Save as WebP with high quality
    webp_path = output_dir / 'cyber-bg.webp'
    bg.save(str(webp_path), 'WEBP', quality=95)
    print(f"Created background: {webp_path}")
    
    # Also save as JPG for fallback
    jpg_path = output_dir / 'cyber-bg.jpg'
    bg.save(str(jpg_path), 'JPEG', quality=95)
    print(f"Created fallback: {jpg_path}")

if __name__ == '__main__':
    main() 