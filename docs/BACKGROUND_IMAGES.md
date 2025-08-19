# Background Images Guide

## Overview

This guide explains how to properly use background images across the DojoPool application.

## Directory Structure

Background images are stored in:

```
src/dojopool/static/images/
```

## Usage

### Basic Implementation

```html
<div
  class="background-image"
  style="background-image: url('{{ url_for('static', filename='images/your-image.jpg') }}')"
></div>
```

### Available Classes

#### Base Class

- `.background-image`: Base class for all background images

#### Size Variations

- `.background-image--contain`: Full contain mode
- `.background-image--80`: 80% width auto height
- `.background-image--fixed`: Fixed background attachment

#### Opacity Variations

- `.background-image--opacity-100`: 100% opacity
- `.background-image--opacity-75`: 75% opacity
- `.background-image--opacity-50`: 50% opacity
- `.background-image--opacity-25`: 25% opacity

#### Filter Effects

- `.background-image--bright`: Increased brightness and contrast
- `.background-image--dark`: Decreased brightness

#### Overlay

- `.background-image--overlay`: Adds a gradient overlay

### Examples

1. Hero Background

```html
<div
  class="background-image background-image--80 background-image--bright"
  style="background-image: url('{{ url_for('static', filename='images/hero-vs.jpg') }}')"
>
  <div class="background-image--overlay"></div>
</div>
```

2. Full-page Background

```html
<div
  class="background-image background-image--fixed background-image--opacity-75"
  style="background-image: url('{{ url_for('static', filename='images/background.jpg') }}')"
></div>
```

## Best Practices

1. Always use `url_for()` for image paths
2. Include appropriate overlay for text readability
3. Consider mobile responsiveness when choosing size variations
4. Use opacity classes to ensure content visibility
5. Test across different screen sizes

## Performance Considerations

1. Optimize images before adding to static directory
2. Use appropriate image formats (JPG for photos, PNG for graphics)
3. Consider lazy loading for below-the-fold images
4. Use responsive images when needed
5. Implement proper caching headers

## Troubleshooting

1. Image not showing:
   - Verify file exists in correct directory
   - Check file permissions
   - Ensure proper URL generation

2. Performance issues:
   - Optimize image size
   - Use appropriate image format
   - Consider using WebP format with fallbacks
   - Implement lazy loading

3. Mobile display issues:
   - Test different background-size options
   - Adjust opacity as needed
   - Consider mobile-specific images

## Maintenance

1. Regularly review and optimize images
2. Keep consistent naming conventions
3. Document any special cases or requirements
4. Monitor performance metrics
5. Update documentation as needed
