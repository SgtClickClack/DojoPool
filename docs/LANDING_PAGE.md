# Landing Page Documentation

## Overview

This document provides comprehensive documentation for the DojoPool landing page (Version 5.0 - Final).
**⚠️ DO NOT MODIFY THE LANDING PAGE WITHOUT EXPLICIT APPROVAL ⚠️**

## File Structure

```
src/
├── static/
│   ├── index.html          # Main landing page
│   ├── images/
│   │   ├── hero-vs.jpg     # Background image
│   │   └── logo.jpg        # Logo image
```

## Design System

### Color Palette

```css
:root {
  --primary-color: #00ff9d; /* Neon green for primary actions */
  --secondary-color: #00a8ff; /* Neon blue for secondary elements */
  --accent-color: #ff3860; /* Accent color for highlights */
  --text-light: #ffffff; /* Light text */
  --background-dark: #0a0a0a; /* Dark background */
}
```

### Typography

- Primary Font Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Hero Title: `5rem`, `900 weight`, `letter-spacing: 6px`
- Subtitle: `1.6rem`, `300 weight`, `letter-spacing: 2px`
- Navigation: `0.9rem`, `600 weight`, `letter-spacing: 2px`
- Buttons: `1.1rem`, `800 weight`, `letter-spacing: 3px`

### Components

#### Navbar

- Fixed position with blur effect
- Neon border bottom
- Animated logo and links
- Responsive mobile menu

#### Hero Section

- Full viewport height
- Glassmorphic content container
- Animated title with neon effect
- Dual-button layout
- Particle effect background

#### Feature Cards

- Three-column layout
- Hover animations
- Neon icon effects
- Clip-path shape design
- Glassmorphic background

### Effects and Animations

#### Neon Glow

```css
text-shadow:
  0 0 10px var(--primary-color),
  0 0 20px var(--primary-color),
  0 0 40px var(--primary-color),
  0 0 80px var(--secondary-color);
```

#### Button Effects

- Hover transform
- Shine animation
- Neon border glow
- Clipped corners

#### Particle System

- 80 particles
- Connected lines
- Interactive hover
- Color matching theme

### Responsive Design

#### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

#### Mobile Optimizations

- Reduced font sizes
- Stacked buttons
- Simplified animations
- Adjusted spacing

### External Dependencies

- Bootstrap 5.1.3
- Bootstrap Icons 1.8.1
- Animate.css 4.1.1
- Particles.js 2.0.0

### Performance Considerations

- Optimized image loading
- Minimal external dependencies
- Efficient CSS animations
- Responsive image sizing
- Cached static assets

## Maintenance Guidelines

### Modification Protocol

1. Any changes must be approved by project lead
2. Document proposed changes in detail
3. Test in all major browsers
4. Verify mobile responsiveness
5. Performance test before deployment

### Backup Procedure

1. Keep versioned copies of:
   - index.html
   - Associated images
   - CSS styles
   - JavaScript functions
2. Store backups in version control
3. Document all versions

### Testing Checklist

- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile devices (iOS, Android)
- [ ] Tablet devices
- [ ] Different screen resolutions
- [ ] Performance metrics
- [ ] Animation smoothness
- [ ] Image loading
- [ ] Interactive elements

## Version History

### Version 5.0 (Current - Final)

- Perfect cyberpunk aesthetic achieved
- Optimized performance
- Enhanced animations
- Mobile-first approach
- Complete documentation

### Previous Versions

- 4.0: Enhanced visual effects
- 3.0: Improved responsiveness
- 2.0: Added animations
- 1.0: Initial design

## Security Measures

- Content Security Policy implemented
- Static file protection
- Rate limiting on endpoints
- Secure asset loading
- XSS protection headers

## Deployment Notes

- Requires nginx configuration
- Static file serving setup
- Proper SSL/TLS settings
- Cache control headers
- Compression enabled

## Support

For any questions or issues:

1. Consult this documentation first
2. Check version control history
3. Contact development team lead
4. Reference backup versions if needed
