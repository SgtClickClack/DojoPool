# DojoPool Style Guide

## Table of Contents
- [Design Tokens](#design-tokens)
- [Layout](#layout)
- [Components](#components)
- [Accessibility](#accessibility)
- [Themes](#themes)
- [Utilities](#utilities)

## Design Tokens

### Colors

#### Primary Colors
```scss
--color-primary-50:  #f0f9ff
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9
--color-primary-600: #0284c7
--color-primary-700: #0369a1
--color-primary-800: #075985
--color-primary-900: #0c4a6e
```

#### Neutral Colors
```scss
--color-gray-50:  #f9fafb
--color-gray-100: #f3f4f6
--color-gray-200: #e5e7eb
--color-gray-300: #d1d5db
--color-gray-400: #9ca3af
--color-gray-500: #6b7280
--color-gray-600: #4b5563
--color-gray-700: #374151
--color-gray-800: #1f2937
--color-gray-900: #111827
```

#### Semantic Colors
```scss
--color-success-500: #22c55e
--color-warning-500: #eab308
--color-error-500:   #ef4444
```

### Typography

#### Font Families
```scss
--font-family-sans: 'Inter', system-ui, sans-serif
--font-family-mono: 'JetBrains Mono', monospace
```

#### Font Sizes
```scss
--font-size-xs:  0.75rem   // 12px
--font-size-sm:  0.875rem  // 14px
--font-size-base: 1rem     // 16px
--font-size-lg:  1.125rem  // 18px
--font-size-xl:  1.25rem   // 20px
--font-size-2xl: 1.5rem    // 24px
--font-size-3xl: 1.875rem  // 30px
--font-size-4xl: 2.25rem   // 36px
```

#### Font Weights
```scss
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-bold:   700
```

### Spacing

```scss
--spacing-0:  0
--spacing-1:  0.25rem  // 4px
--spacing-2:  0.5rem   // 8px
--spacing-3:  0.75rem  // 12px
--spacing-4:  1rem     // 16px
--spacing-5:  1.25rem  // 20px
--spacing-6:  1.5rem   // 24px
--spacing-8:  2rem     // 32px
--spacing-10: 2.5rem   // 40px
--spacing-12: 3rem     // 48px
--spacing-16: 4rem     // 64px
```

### Breakpoints

```scss
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
```

## Layout

### Grid System

The grid system uses CSS Grid with a 12-column layout:

```html
<div class="grid grid-cols-12 gap-4">
  <div class="col-span-4">4 columns</div>
  <div class="col-span-8">8 columns</div>
</div>
```

#### Responsive Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Content -->
</div>
```

### Container

```html
<div class="container">
  <!-- Content with max-width and centered -->
</div>
```

## Components

### Buttons

#### Basic Button
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
```

#### Button Sizes
```html
<button class="btn btn-sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn-lg">Large</button>
```

#### Button States
```html
<button class="btn" disabled>Disabled</button>
<button class="btn btn-loading">Loading...</button>
```

### Forms

#### Text Input
```html
<div class="form-group">
  <label class="form-label">Username</label>
  <input type="text" class="form-control" />
  <div class="form-hint">Enter your username</div>
</div>
```

#### Validation States
```html
<div class="form-group">
  <input class="form-control is-valid" />
  <div class="form-feedback">Looks good!</div>
</div>

<div class="form-group">
  <input class="form-control is-invalid" />
  <div class="form-feedback">This field is required</div>
</div>
```

### Cards

#### Basic Card
```html
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>
```

#### Card Variants
```html
<div class="card card-primary">Primary</div>
<div class="card card-secondary">Secondary</div>
```

## Accessibility

### Screen Reader Only
```html
<span class="sr-only">Hidden from visual users</span>
```

### Skip Links
```html
<a href="#main" class="skip-link">Skip to main content</a>
```

### ARIA Patterns

#### Tabs
```html
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Tab 1 content</div>
```

#### Dialog
```html
<div role="dialog" aria-modal="true">
  <div class="dialog-header">
    <button aria-label="Close">×</button>
  </div>
  <div class="dialog-body">Content</div>
</div>
```

## Themes

### Theme Variables
```scss
// Light theme
:root {
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text-primary: #111827;
}

// Dark theme
[data-theme="dark"] {
  --color-background: #111827;
  --color-surface: #1f2937;
  --color-text-primary: #f9fafb;
}
```

### Theme Toggle
```html
<button class="theme-toggle" aria-label="Toggle theme">
  <span class="theme-toggle-icon"></span>
</button>
```

## Utilities

### Spacing
```html
<div class="m-4">Margin 1rem</div>
<div class="p-4">Padding 1rem</div>
<div class="mt-4">Margin top 1rem</div>
<div class="mb-4">Margin bottom 1rem</div>
```

### Typography
```html
<p class="text-sm">Small text</p>
<p class="text-lg">Large text</p>
<p class="font-bold">Bold text</p>
<p class="text-primary">Primary color text</p>
```

### Display
```html
<div class="hidden">Hidden</div>
<div class="block">Block</div>
<div class="flex">Flex container</div>
<div class="grid">Grid container</div>
```

### Position
```html
<div class="relative">Relative</div>
<div class="absolute">Absolute</div>
<div class="fixed">Fixed</div>
<div class="sticky">Sticky</div>
```

### Responsive Utilities
```html
<div class="hidden md:block">Hidden on mobile, visible on desktop</div>
<div class="block md:hidden">Visible on mobile, hidden on desktop</div>
```

## Best Practices

1. **Responsive Design**
   - Always start with mobile-first approach
   - Use breakpoint mixins for responsive styles
   - Test across different screen sizes

2. **Accessibility**
   - Include proper ARIA attributes
   - Ensure sufficient color contrast
   - Support keyboard navigation
   - Test with screen readers

3. **Performance**
   - Use CSS custom properties for theme values
   - Minimize use of complex selectors
   - Avoid deep nesting
   - Use utility classes when possible

4. **Maintainability**
   - Follow BEM naming convention
   - Keep components modular
   - Document complex patterns
   - Use consistent spacing and formatting

5. **Browser Support**
   - Test across major browsers
   - Provide fallbacks for modern features
   - Use autoprefixer for vendor prefixes
</rewritten_file> 