from bs4 import BeautifulSoup
from typing import Dict, Optional
import logging

def add_lazy_loading(html: str) -> str:
    """Add lazy loading attributes to image tags in HTML.
    
    Args:
        html: HTML content to process
    
    Returns:
        str: Modified HTML with lazy loading attributes
    """
    try:
        soup = BeautifulSoup(html, 'html.parser')
        images = soup.find_all('img')
        
        for img in images:
            # Skip images that already have loading attribute or no-lazy class
            if 'loading' in img.attrs or 'no-lazy' in img.get('class', []):
                continue
            
            img['loading'] = 'lazy'
        
        return str(soup)
    except Exception as e:
        logging.error(f"Error adding lazy loading: {str(e)}")
        return html

def add_responsive_images(
    html: str,
    variants: Dict[str, str | Dict[str, str]],
    breakpoints: Dict[str, str],
    include_webp: bool = False
) -> str:
    """Add responsive image markup with optional WebP support.
    
    Args:
        html: HTML content containing img tags
        variants: Dictionary of image variants (size name -> path or format dict)
        breakpoints: Dictionary of size names to width descriptors
        include_webp: Whether to include WebP sources
    
    Returns:
        str: Modified HTML with responsive image markup
    """
    try:
        soup = BeautifulSoup(html, 'html.parser')
        images = soup.find_all('img')
        
        for img in images:
            original_src = img.get('src', '')
            if not original_src:
                continue
            
            if include_webp and isinstance(variants[next(iter(variants))], dict):
                # Create picture element for WebP support
                picture = soup.new_tag('picture')
                img.wrap(picture)
                
                # Add WebP source
                webp_srcset = []
                for size, paths in variants.items():
                    if isinstance(paths, dict) and 'webp' in paths:
                        webp_srcset.append(f"{paths['webp']} {breakpoints[size]}")
                
                if webp_srcset:
                    webp_source = soup.new_tag('source', type='image/webp')
                    webp_source['srcset'] = ', '.join(webp_srcset)
                    picture.insert(0, webp_source)
                
                # Add fallback source
                jpg_srcset = []
                for size, paths in variants.items():
                    if isinstance(paths, dict) and 'jpg' in paths:
                        jpg_srcset.append(f"{paths['jpg']} {breakpoints[size]}")
                
                if jpg_srcset:
                    jpg_source = soup.new_tag('source', type='image/jpeg')
                    jpg_source['srcset'] = ', '.join(jpg_srcset)
                    picture.insert(1, jpg_source)
            else:
                # Simple srcset for single format
                srcset = []
                for size, path in variants.items():
                    if isinstance(path, str):
                        srcset.append(f"{path} {breakpoints[size]}")
                
                if srcset:
                    img['srcset'] = ', '.join(srcset)
                    img['sizes'] = '100vw'  # Default sizes attribute
            
            # Add lazy loading
            if 'loading' not in img.attrs:
                img['loading'] = 'lazy'
        
        return str(soup)
    except Exception as e:
        logging.error(f"Error adding responsive images: {str(e)}")
        return html 