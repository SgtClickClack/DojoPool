# Getting Started

Welcome to DojoPool! This guide will help you get up and running with our component library and design system.

## Quick Start

1. Install the package:

```bash
npm install dojo-pool
```

2. Import the styles:

```scss
// In your main.scss
@use '@dojo-pool/styles/main';
```

3. Start using components:

```html
<button class="btn btn-primary">Get Started</button>
```

## Project Structure

```
dojo-pool/
├── src/
│   ├── static/
│   │   ├── scss/           # Styles
│   │   │   ├── abstracts/  # Variables, mixins
│   │   │   ├── base/       # Reset, typography
│   │   │   ├── components/ # Component styles
│   │   │   ├── layout/     # Grid, containers
│   │   │   ├── pages/      # Page-specific styles
│   │   │   ├── themes/     # Theme variations
│   │   │   └── utilities/  # Utility classes
│   │   └── js/            # JavaScript files
│   └── templates/         # HTML templates
└── docs/                  # Documentation
```

## Core Concepts

### 1. Design Tokens

We use CSS custom properties for consistent styling:

```scss
:root {
  --color-primary: #0066cc;
  --spacing-4: 1rem;
  --font-size-base: 1rem;
}
```

### 2. Component Structure

Components follow a consistent pattern:

```html
<!-- Base component -->
<div class="component">
  <!-- Component elements -->
  <div class="component__element">
    <!-- Modifiers when needed -->
    <span class="component__element--modifier"> Content </span>
  </div>
</div>
```

### 3. Utility Classes

Utility classes for quick styling:

```html
<div class="mt-4 text-center bg-primary">
  <!-- Content -->
</div>
```

## Basic Examples

### Creating a Card

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">
    <p class="card-text">Card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Building a Form

```html
<form class="form">
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" class="form-control" required />
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

## Theme Support

Enable theme switching:

```javascript
// In your JavaScript
import { initTheme } from '@dojo-pool/theme';

initTheme();
```

```html
<!-- In your HTML -->
<button class="theme-toggle" aria-label="Toggle theme">Toggle Theme</button>
```

## Responsive Design

Our components are mobile-first by default:

```html
<div class="grid">
  <div class="col-12 md:col-6 lg:col-4">
    <!-- Responsive column -->
  </div>
</div>
```

## Accessibility

All components are built with accessibility in mind:

```html
<button class="btn btn-primary" aria-label="Save changes">
  <span class="icon" aria-hidden="true">
    <!-- Icon -->
  </span>
  Save
</button>
```

## Best Practices

1. **Use Semantic HTML**

   ```html
   <!-- Do -->
   <button class="btn">Click me</button>

   <!-- Don't -->
   <div class="btn" onclick="...">Click me</div>
   ```

2. **Follow Component Patterns**

   ```html
   <!-- Do -->
   <div class="card">
     <div class="card-body">...</div>
   </div>

   <!-- Don't -->
   <div class="card">
     <div class="body">...</div>
   </div>
   ```

3. **Use Utility Classes Wisely**

   ```html
   <!-- Do -->
   <div class="mt-4 text-center">...</div>

   <!-- Don't -->
   <div style="margin-top: 1rem; text-align: center;">...</div>
   ```

## Common Issues

### 1. Styles Not Loading

Make sure you've imported the styles correctly:

```scss
// main.scss
@use '@dojo-pool/styles/main';
```

### 2. JavaScript Not Working

Check that you've initialized components:

```javascript
// main.js
import { initComponents } from '@dojo-pool/core';

initComponents();
```

### 3. Theme Issues

Verify theme variables are accessible:

```scss
// _variables.scss
@use '@dojo-pool/styles/abstracts/variables' as *;
```

## Next Steps

1. Explore our [Component Documentation](../components/README.md)
2. Learn about our [Design System](../styles/README.md)
3. Check out [Advanced Topics](advanced/README.md)
4. Read our [Contributing Guide](contributing/README.md)

## Support

- 📖 [Full Documentation](https://docs.dojopool.com)
- 💬 [Discord Community](https://discord.gg/dojopool)
- 🐛 [Issue Tracker](https://github.com/your-org/dojo-pool/issues)
- 📝 [Release Notes](../CHANGELOG.md)
