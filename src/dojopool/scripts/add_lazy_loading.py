import os
from pathlib import Path
from bs4 import BeautifulSoup
import re

def get_templates_dir():
    """Get the path to the templates directory."""
    script_dir = Path(__file__).resolve().parent.parent
    return script_dir / 'templates'

def add_lazy_loading(html_file):
    """Add lazy loading and WebP support to images in HTML file."""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        # Process each img tag
        for img in soup.find_all('img'):
            # Skip if already has lazy loading
            if img.get('loading') == 'lazy':
                continue

            # Add lazy loading
            img['loading'] = 'lazy'

            # Get the source path
            src = img.get('src')
            if not src:
                continue

            # Check if WebP version exists
            if src.endswith(('.jpg', '.jpeg', '.png')):
                webp_src = re.sub(r'\.(jpg|jpeg|png)$', '.webp', src)
                static_path = Path('src/dojopool/static')
                webp_path = static_path / webp_src.lstrip('/')
                
                if webp_path.exists():
                    # Create picture element
                    picture = soup.new_tag('picture')
                    source = soup.new_tag('source')
                    source['srcset'] = webp_src
                    source['type'] = 'image/webp'
                    
                    # Move img attributes to picture
                    for attr in ['class', 'style']:
                        if img.get(attr):
                            picture[attr] = img[attr]
                            del img[attr]
                    
                    # Wrap img with picture and source
                    img.wrap(picture)
                    picture.insert(0, source)

        # Save the modified file
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(str(soup))
            
        print(f"Updated: {html_file}")
        
    except Exception as e:
        print(f"Error processing {html_file}: {e}")

def process_templates():
    """Process all HTML templates in the templates directory."""
    templates_dir = get_templates_dir()
    for html_file in templates_dir.glob('**/*.html'):
        add_lazy_loading(html_file)

if __name__ == '__main__':
    process_templates() 