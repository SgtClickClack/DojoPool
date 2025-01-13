import pytest
from bs4 import BeautifulSoup, Tag
from typing import Dict, Union, cast
from dojopool.utils.lazy_loading import add_lazy_loading, add_responsive_images

def test_add_lazy_loading_to_img():
    """Test adding lazy loading to img tags."""
    html = """
    <html>
        <body>
            <img src="test.jpg">
            <img src="test2.jpg" loading="eager">
            <img src="test3.jpg" class="no-lazy">
        </body>
    </html>
    """
    
    modified = add_lazy_loading(html)
    soup = BeautifulSoup(modified, 'html.parser')
    
    images = soup.find_all('img')
    assert len(images) == 3
    first_img = cast(Tag, images[0])
    second_img = cast(Tag, images[1])
    third_img = cast(Tag, images[2])
    
    assert 'loading' in first_img.attrs and first_img.attrs['loading'] == 'lazy'
    assert 'loading' in second_img.attrs and second_img.attrs['loading'] == 'eager'
    assert 'loading' not in third_img.attrs

def test_add_lazy_loading_with_srcset():
    """Test lazy loading with srcset attributes."""
    html = """
    <img src="test.jpg" 
         srcset="test-small.jpg 300w, test-medium.jpg 600w, test-large.jpg 900w"
         sizes="(max-width: 300px) 300px, (max-width: 600px) 600px, 900px">
    """
    
    modified = add_lazy_loading(html)
    soup = BeautifulSoup(modified, 'html.parser')
    img = cast(Tag, soup.find('img'))
    
    assert img is not None
    assert 'loading' in img.attrs and img.attrs['loading'] == 'lazy'
    assert 'srcset' in img.attrs
    assert 'sizes' in img.attrs

def test_add_responsive_images():
    """Test adding responsive image markup."""
    html = '<img src="test.jpg" alt="Test image">'
    
    variants: Dict[str, Union[str, Dict[str, str]]] = {
        'sm': 'test-small.jpg',
        'md': 'test-medium.jpg',
        'lg': 'test-large.jpg'
    }
    
    breakpoints = {
        'sm': '300w',
        'md': '600w',
        'lg': '900w'
    }
    
    modified = add_responsive_images(html, variants, breakpoints)
    soup = BeautifulSoup(modified, 'html.parser')
    img = cast(Tag, soup.find('img'))
    
    assert img is not None
    assert 'srcset' in img.attrs
    assert 'sizes' in img.attrs
    # Check each variant path is in srcset
    for variant in variants.values():
        if isinstance(variant, str):
            assert variant in img.attrs['srcset']

def test_add_lazy_loading_with_picture():
    """Test lazy loading with picture elements."""
    html = """
    <picture>
        <source media="(min-width: 800px)" srcset="large.jpg">
        <source media="(min-width: 400px)" srcset="medium.jpg">
        <img src="small.jpg" alt="Test image">
    </picture>
    """
    
    modified = add_lazy_loading(html)
    soup = BeautifulSoup(modified, 'html.parser')
    img = cast(Tag, soup.find('img'))
    
    assert img is not None
    assert 'loading' in img.attrs and img.attrs['loading'] == 'lazy'
    sources = soup.find_all('source')
    assert len(sources) == 2
    assert all('srcset' in cast(Tag, source).attrs for source in sources)

def test_add_responsive_images_with_webp():
    """Test adding responsive images with WebP support."""
    html = '<img src="test.jpg" alt="Test image">'
    
    variants: Dict[str, Union[str, Dict[str, str]]] = {
        'sm': {'jpg': 'test-small.jpg', 'webp': 'test-small.webp'},
        'md': {'jpg': 'test-medium.jpg', 'webp': 'test-medium.webp'},
        'lg': {'jpg': 'test-large.jpg', 'webp': 'test-large.webp'}
    }
    
    breakpoints = {
        'sm': '300w',
        'md': '600w',
        'lg': '900w'
    }
    
    modified = add_responsive_images(html, variants, breakpoints, include_webp=True)
    soup = BeautifulSoup(modified, 'html.parser')
    
    picture = cast(Tag, soup.find('picture'))
    assert picture is not None
    
    webp_source = cast(Tag, picture.find('source', attrs={'type': 'image/webp'}))
    assert webp_source is not None
    assert 'srcset' in webp_source.attrs
    
    jpeg_source = cast(Tag, picture.find('source', attrs={'type': 'image/jpeg'}))
    assert jpeg_source is not None
    assert 'srcset' in jpeg_source.attrs
    
    img = cast(Tag, picture.find('img'))
    assert img is not None
    assert 'loading' in img.attrs and img.attrs['loading'] == 'lazy'
    assert img.attrs['src'] == 'test.jpg'

def test_invalid_html_handling():
    """Test handling of invalid HTML."""
    invalid_html = "<img src='test.jpg'><unpaired-tag>"
    
    # Should not raise an exception
    modified = add_lazy_loading(invalid_html)
    soup = BeautifulSoup(modified, 'html.parser')
    img = cast(Tag, soup.find('img'))
    assert img is not None
    assert 'loading' in img.attrs and img.attrs['loading'] == 'lazy'

def test_empty_html_handling():
    """Test handling of empty HTML."""
    empty_html = ""
    modified = add_lazy_loading(empty_html)
    assert modified == empty_html

def test_no_images_html():
    """Test handling HTML without images."""
    html = "<p>No images here</p>"
    modified = add_lazy_loading(html)
    assert modified == html 