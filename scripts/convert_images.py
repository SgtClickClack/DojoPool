from pathlib import Path
from PIL import Image

# Directory containing the images
image_dir = Path(__file__).parent / "static" / "images"

# List of JPG files to convert
jpg_files = ["logo.jpg", "hero-vs.jpg", "hero-bg.jpg"]

for jpg_file in jpg_files:
    source = image_dir / jpg_file
    destination = image_dir / (jpg_file.replace(".jpg", ".webp"))
    
    print(f"Converting {jpg_file} to WebP format...")
    try:
        # Open and convert image
        with Image.open(source) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Save as WebP
            img.save(str(destination), "WEBP", quality=85, method=6)
            print(f"Successfully converted {jpg_file} to {destination.name}")
    except Exception as e:
        print(f"Error converting {jpg_file}: {str(e)}") 