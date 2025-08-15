# Responsive Design Documentation

## Table of Contents
- [Breakpoints](#breakpoints)
- [Grid System](#grid-system)
- [Typography](#typography)
- [Images](#images)
- [Navigation](#navigation)
- [Tables](#tables)
- [Forms](#forms)
- [Best Practices](#best-practices)

## Breakpoints

Our design system uses the following breakpoints:

```scss
$breakpoints: (
    'xs': 0,
    'sm': 576px,
    'md': 768px,
    'lg': 992px,
    'xl': 1200px,
    'xxl': 1400px
);
```

### Usage with Mixins

```scss
@mixin respond-to($breakpoint) {
    @if map-has-key($breakpoints, $breakpoint) {
        @media (min-width: map-get($breakpoints, $breakpoint)) {
            @content;
        }
    }
}

// Example usage
.element {
    width: 100%;
    
    @include respond-to('md') {
        width: 50%;
    }
    
    @include respond-to('lg') {
        width: 33.333%;
    }
}
```

## Grid System

Our grid system is built using CSS Grid and Flexbox.

### Container

```scss
.container {
    width: 100%;
    margin-right: auto;
    margin-left: auto;
    padding-right: var(--spacing-4);
    padding-left: var(--spacing-4);
    
    @include respond-to('sm') {
        max-width: 540px;
    }
    
    @include respond-to('md') {
        max-width: 720px;
    }
    
    @include respond-to('lg') {
        max-width: 960px;
    }
    
    @include respond-to('xl') {
        max-width: 1140px;
    }
    
    @include respond-to('xxl') {
        max-width: 1320px;
    }
}

.container-fluid {
    width: 100%;
    margin-right: auto;
    margin-left: auto;
    padding-right: var(--spacing-4);
    padding-left: var(--spacing-4);
}
```

### Grid Layout

```scss
.grid {
    display: grid;
    gap: var(--spacing-4);
    
    &-cols-1 { grid-template-columns: repeat(1, 1fr); }
    &-cols-2 { grid-template-columns: repeat(2, 1fr); }
    &-cols-3 { grid-template-columns: repeat(3, 1fr); }
    &-cols-4 { grid-template-columns: repeat(4, 1fr); }
    
    @include respond-to('md') {
        &-md-cols-2 { grid-template-columns: repeat(2, 1fr); }
        &-md-cols-3 { grid-template-columns: repeat(3, 1fr); }
        &-md-cols-4 { grid-template-columns: repeat(4, 1fr); }
    }
}
```

### Flexbox Layout

```scss
.flex {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    
    &-col {
        flex: 1 0 100%;
        
        @include respond-to('md') {
            flex: 1 0 0%;
        }
    }
    
    &-col-auto {
        flex: 0 0 auto;
    }
}
```

## Typography

Responsive typography using fluid scaling:

```scss
:root {
    --font-size-base: 16px;
    --line-height-base: 1.5;
    
    @include respond-to('md') {
        --font-size-base: calc(16px + 0.5vw);
    }
}

h1 {
    font-size: calc(var(--font-size-base) * 2.5);
    line-height: 1.2;
    
    @include respond-to('md') {
        font-size: calc(var(--font-size-base) * 3);
    }
}

h2 {
    font-size: calc(var(--font-size-base) * 2);
    line-height: 1.3;
    
    @include respond-to('md') {
        font-size: calc(var(--font-size-base) * 2.5);
    }
}

// ... other heading styles
```

## Images

Responsive image handling:

```scss
.img-fluid {
    max-width: 100%;
    height: auto;
}

.img-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.img-contain {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

// Picture element for art direction
<picture>
    <source 
        media="(min-width: 800px)"
        srcset="hero-desktop.jpg"
    >
    <source 
        media="(min-width: 400px)"
        srcset="hero-tablet.jpg"
    >
    <img 
        src="hero-mobile.jpg" 
        alt="Hero image"
        class="img-fluid"
    >
</picture>
```

## Navigation

Responsive navigation patterns:

### Mobile Menu

```scss
.navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4);
    
    &-menu {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-background);
        padding: var(--spacing-4);
        
        &.is-open {
            display: flex;
            flex-direction: column;
        }
        
        @include respond-to('md') {
            position: static;
            display: flex;
            background: none;
            padding: 0;
        }
    }
    
    &-toggle {
        @include respond-to('md') {
            display: none;
        }
    }
}
```

### Dropdown Menu

```scss
.dropdown {
    position: relative;
    
    &-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 200px;
        background: var(--color-background);
        box-shadow: var(--shadow-lg);
        
        @include respond-to('md') {
            position: absolute;
            top: 100%;
            left: 0;
        }
    }
    
    &.is-open &-menu {
        display: block;
    }
}
```

## Tables

Responsive table patterns:

### Horizontal Scroll

```scss
.table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
```

### Stack on Mobile

```scss
.table-stack {
    @media (max-width: map-get($breakpoints, 'md')) {
        thead {
            display: none;
        }
        
        tr {
            display: block;
            margin-bottom: var(--spacing-4);
        }
        
        td {
            display: block;
            text-align: right;
            
            &::before {
                content: attr(data-label);
                float: left;
                font-weight: bold;
            }
        }
    }
}
```

## Forms

Responsive form layouts:

```scss
.form {
    display: grid;
    gap: var(--spacing-4);
    
    @include respond-to('md') {
        grid-template-columns: repeat(2, 1fr);
    }
    
    &-full {
        grid-column: 1 / -1;
    }
    
    &-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
    }
}

.input {
    width: 100%;
    padding: var(--spacing-2);
    
    @include respond-to('md') {
        padding: var(--spacing-3);
    }
}
```

## Best Practices

1. **Mobile First**
   - Start with mobile layout
   - Add complexity for larger screens
   - Use min-width media queries
   - Test on real devices

2. **Performance**
   - Optimize images for different sizes
   - Use responsive images (srcset, sizes)
   - Lazy load off-screen content
   - Minimize layout shifts

3. **Layout**
   - Use relative units (rem, em, %)
   - Avoid fixed widths
   - Use CSS Grid and Flexbox
   - Consider touch targets on mobile

4. **Typography**
   - Use fluid typography
   - Maintain readability
   - Test line lengths
   - Adjust spacing for readability

5. **Testing**
   - Test on multiple devices
   - Use browser dev tools
   - Check for layout shifts
   - Validate accessibility

6. **Content**
   - Prioritize content for mobile
   - Use progressive disclosure
   - Consider loading order
   - Optimize for different contexts

7. **Navigation**
   - Make navigation accessible
   - Consider touch targets
   - Provide clear feedback
   - Test keyboard navigation

8. **Images**
   - Use responsive images
   - Optimize for different sizes
   - Consider art direction
   - Maintain aspect ratios

9. **Forms**
   - Use appropriate input types
   - Consider touch keyboards
   - Provide clear validation
   - Test on real devices

10. **Accessibility**
    - Maintain focus management
    - Use proper ARIA roles
    - Test with screen readers
    - Support keyboard navigation 