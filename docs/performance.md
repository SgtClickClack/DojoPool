# Performance Optimization

## Table of Contents

- [CSS Optimization](#css-optimization)
- [JavaScript Optimization](#javascript-optimization)
- [Image Optimization](#image-optimization)
- [Loading Strategies](#loading-strategies)
- [Caching Strategies](#caching-strategies)
- [Performance Metrics](#performance-metrics)
- [Best Practices](#best-practices)

## CSS Optimization

### Critical CSS

Inline critical CSS for above-the-fold content:

```html
<head>
  <style>
    /* Critical CSS */
    .header,
    .hero,
    .main-nav {
      /* Styles for above-the-fold content */
    }
  </style>

  <link
    rel="preload"
    href="/css/main.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <noscript>
    <link rel="stylesheet" href="/css/main.css" />
  </noscript>
</head>
```

### CSS Minification

Use a build tool to minify CSS:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
    ],
  },
};

// postcss.config.js
module.exports = {
  plugins: [
    require('cssnano')({
      preset: 'default',
    }),
  ],
};
```

### Unused CSS Removal

Use PurgeCSS to remove unused styles:

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html', './src/**/*.js'],
    }),
  ],
};
```

## JavaScript Optimization

### Code Splitting

Split code into smaller chunks:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 50000,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

### Lazy Loading

Lazy load components and routes:

```javascript
// React example
const LazyComponent = React.lazy(() => import('./components/LazyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}

// Vanilla JS example
async function loadModule() {
  const module = await import('./module.js');
  module.init();
}

button.addEventListener('click', loadModule);
```

### Tree Shaking

Enable tree shaking in your build:

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    minimize: true,
  },
};
```

## Image Optimization

### Responsive Images

Use srcset and sizes attributes:

```html
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="
        (max-width: 400px) 100vw,
        (max-width: 800px) 80vw,
        70vw
    "
  alt="Responsive image"
/>
```

### Lazy Loading

Use native lazy loading:

```html
<img src="image.jpg" loading="lazy" alt="Lazy loaded image" />
```

### Image Formats

Use modern image formats:

```html
<picture>
  <source type="image/webp" srcset="image.webp" />
  <source type="image/jpeg" srcset="image.jpg" />
  <img src="image.jpg" alt="Optimized image" />
</picture>
```

## Loading Strategies

### Resource Hints

Use resource hints to optimize loading:

```html
<head>
  <!-- Preconnect to required origins -->
  <link rel="preconnect" href="https://api.example.com" />

  <!-- Prefetch for future navigation -->
  <link rel="prefetch" href="/next-page.html" />

  <!-- Preload critical resources -->
  <link
    rel="preload"
    href="/fonts/font.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
</head>
```

### Progressive Loading

Implement progressive loading:

```javascript
// Load more items on scroll
function loadMore() {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadMoreItems();
        observer.unobserve(entry.target);
      }
    });
  }, options);

  observer.observe(document.querySelector('.load-more'));
}
```

## Caching Strategies

### Service Worker

Implement a service worker for caching:

```javascript
// service-worker.js
const CACHE_NAME = 'v1';
const URLS_TO_CACHE = ['/', '/css/main.css', '/js/main.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### Browser Caching

Configure server caching headers:

```apache
# Apache (.htaccess)
<IfModule mod_expires.c>
    ExpiresActive On

    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"

    # CSS, JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # Fonts
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
</IfModule>
```

## Performance Metrics

### Core Web Vitals

Monitor Core Web Vitals:

```javascript
// Report Core Web Vitals
addEventListener('DOMContentLoaded', () => {
  // LCP
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lcpEntry = entries[entries.length - 1];
    console.log('LCP:', lcpEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // FID
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  }).observe({ entryTypes: ['first-input'] });

  // CLS
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log('CLS:', entry.value);
    });
  }).observe({ entryTypes: ['layout-shift'] });
});
```

### Custom Metrics

Track custom performance metrics:

```javascript
// Performance marks and measures
performance.mark('start');

// ... some operation

performance.mark('end');
performance.measure('operation', 'start', 'end');

// Report to analytics
const metrics = performance.getEntriesByType('measure');
metrics.forEach((metric) => {
  analytics.send({
    name: metric.name,
    duration: metric.duration,
  });
});
```

## Best Practices

1. **Asset Optimization**
   - Minify and compress assets
   - Use modern image formats
   - Implement responsive images
   - Enable text compression

2. **Loading Performance**
   - Implement critical CSS
   - Use lazy loading
   - Optimize resource hints
   - Implement code splitting

3. **Caching Strategy**
   - Use service workers
   - Configure browser caching
   - Implement cache busting
   - Use appropriate cache headers

4. **JavaScript Performance**
   - Use tree shaking
   - Implement code splitting
   - Defer non-critical scripts
   - Optimize event handlers

5. **Monitoring and Metrics**
   - Track Core Web Vitals
   - Monitor custom metrics
   - Use performance budgets
   - Regular performance audits

6. **Build Optimization**
   - Optimize bundler config
   - Remove unused code
   - Minimize dependencies
   - Use production builds

7. **Network Optimization**
   - Use CDN
   - Optimize API calls
   - Minimize HTTP requests
   - Enable HTTP/2

8. **Runtime Performance**
   - Optimize animations
   - Minimize layout shifts
   - Reduce DOM size
   - Use efficient selectors

9. **Testing**
   - Test on real devices
   - Use performance tools
   - Monitor metrics
   - Regular audits

10. **Documentation**
    - Document optimizations
    - Maintain performance budget
    - Track improvements
    - Share best practices
