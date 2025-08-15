# Installation

This guide covers how to install and set up DojoPool in your project.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Basic knowledge of HTML, CSS, and JavaScript

## Installation Methods

### 1. NPM Installation

```bash
# Using npm
npm install dojo-pool

# Using yarn
yarn add dojo-pool
```

### 2. Manual Installation

1. Download the latest release from our [releases page](https://github.com/your-org/dojo-pool/releases)
2. Extract the files into your project
3. Include the necessary files in your HTML

```html
<link rel="stylesheet" href="path/to/dojo-pool/dist/css/main.css">
<script src="path/to/dojo-pool/dist/js/main.js"></script>
```

## Basic Setup

### 1. Styles Setup

#### Using SCSS (Recommended)

```scss
// main.scss
@use '@dojo-pool/styles/main';

// Optional: Import specific components
@use '@dojo-pool/styles/components/buttons';
@use '@dojo-pool/styles/components/forms';
```

#### Using CSS

```html
<!-- In your HTML head -->
<link rel="stylesheet" href="node_modules/dojo-pool/dist/css/main.css">
```

### 2. JavaScript Setup

#### Using Modules (Recommended)

```javascript
// main.js
import { initComponents } from '@dojo-pool/core';
import { initTheme } from '@dojo-pool/theme';

// Initialize components
initComponents();

// Initialize theme support
initTheme();
```

#### Using Script Tags

```html
<script src="node_modules/dojo-pool/dist/js/main.js"></script>
<script>
    DojoPool.initComponents();
    DojoPool.initTheme();
</script>
```

## Configuration

### 1. Customizing Variables

Create a `_variables.scss` file to override default values:

```scss
// _variables.scss
@use '@dojo-pool/styles/abstracts/variables' with (
    $primary-color: #0066cc,
    $font-family-base: 'Inter, sans-serif',
    $border-radius: 0.5rem
);
```

### 2. Theme Configuration

```javascript
// theme-config.js
export const themeConfig = {
    themes: {
        light: {
            primary: '#0066cc',
            background: '#ffffff',
            text: '#000000'
        },
        dark: {
            primary: '#66b3ff',
            background: '#1a1a1a',
            text: '#ffffff'
        }
    },
    defaultTheme: 'light'
};
```

### 3. Component Configuration

```javascript
// component-config.js
export const componentConfig = {
    buttons: {
        defaultVariant: 'primary',
        roundedCorners: true
    },
    forms: {
        validationMode: 'live',
        showIcons: true
    }
};
```

## Build Setup

### 1. Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    }
};
```

### 2. Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "@/styles/_variables.scss" as *;`
            }
        }
    }
});
```

## Environment Setup

### 1. Development Environment

```bash
# Install development dependencies
npm install --save-dev @dojo-pool/dev-tools

# Start development server
npm run dev
```

### 2. Production Environment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing Installation

Create a test page to verify the installation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DojoPool Test</title>
    <link rel="stylesheet" href="/dist/css/main.css">
</head>
<body>
    <div class="container">
        <h1>DojoPool Test Page</h1>
        
        <!-- Test Button -->
        <button class="btn btn-primary">
            Test Button
        </button>
        
        <!-- Test Form -->
        <form class="form mt-4">
            <div class="form-group">
                <label for="test">Test Input</label>
                <input 
                    type="text" 
                    id="test" 
                    class="form-control"
                >
            </div>
        </form>
    </div>
    
    <script src="/dist/js/main.js"></script>
    <script>
        // Verify initialization
        console.log('DojoPool initialized:', !!window.DojoPool);
    </script>
</body>
</html>
```

## Troubleshooting

### Common Issues

1. **Styles Not Loading**
   - Check import paths
   - Verify build configuration
   - Check for CSS extraction settings

2. **JavaScript Errors**
   - Check browser console
   - Verify import paths
   - Check initialization order

3. **Theme Issues**
   - Verify theme configuration
   - Check CSS custom properties
   - Test theme toggle functionality

### Getting Help

If you encounter issues:

1. Check our [FAQ](./faq)
2. Search [existing issues](https://github.com/your-org/dojo-pool/issues)
3. Join our [Discord community](https://discord.gg/dojopool)
4. Create a new issue

## Next Steps

1. Read the [Getting Started Guide](./introduction)
2. Explore [Components](../components/)
3. Learn about [Customization](./customization)
4. Check [Best Practices](./best-practices) 