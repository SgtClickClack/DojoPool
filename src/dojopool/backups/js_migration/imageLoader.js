// Image preloading and optimization module
import bandwidthTracker from './bandwidthTracker.js';

class ImageLoader {
    constructor() {
        this.preloadedImages = new Set();
        this.observer = null;
        this.networkQuality = this.getNetworkQuality();
        this.initIntersectionObserver();
        this.initNetworkObserver();
        this.initBandwidthOptimization();
    }

    // Initialize bandwidth optimization
    initBandwidthOptimization() {
        window.addEventListener('bandwidthOptimization', (event) => {
            const { recommendations, stats } = event.detail;
            this.handleOptimizationRecommendations(recommendations, stats);
        });
    }

    // Handle optimization recommendations
    handleOptimizationRecommendations(recommendations, stats) {
        if (recommendations.includes('Session bandwidth usage is high, switching to low-quality images')) {
            this.networkQuality = 'low';
            this.updateLoadedImages();
        } else if (stats.averageLoadTime > 3000) {
            // If average load time is too high, try to preload next images
            this.preloadNextImages();
        }
    }

    // Preload next images that might be needed
    preloadNextImages() {
        document.querySelectorAll('img[data-src]:not(.loaded):not(.loading)').forEach(img => {
            const rect = img.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // If image is within 2 viewport heights, preload it
            if (rect.top < viewportHeight * 2) {
                this.loadImage(img);
            }
        });
    }

    // Initialize intersection observer for lazy loading
    initIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        this.loadImage(img);
                    }
                    this.observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
    }

    // Initialize network observer
    initNetworkObserver() {
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.networkQuality = this.getNetworkQuality();
                this.updateLoadedImages();
            });
        }
    }

    // Get current network quality considering bandwidth usage
    getNetworkQuality() {
        let quality = 'medium';

        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.saveData) {
                quality = 'low';
            } else if (connection.type === 'cellular') {
                switch (connection.effectiveType) {
                    case 'slow-2g':
                    case '2g':
                        quality = 'low';
                        break;
                    case '3g':
                        quality = 'medium';
                        break;
                    case '4g':
                        quality = 'high';
                        break;
                }
            } else if (connection.downlink !== undefined) {
                if (connection.downlink < 1) quality = 'low';
                else if (connection.downlink < 5) quality = 'medium';
                else quality = 'high';
            }
        }

        // Consider bandwidth usage in quality determination
        const bandwidthCondition = bandwidthTracker.getNetworkCondition();
        return bandwidthCondition === 'slow' ? 'low' : quality;
    }

    // Get appropriate image size based on network quality and bandwidth
    getAppropriateSize(availableSizes) {
        const viewportWidth = window.innerWidth;
        const quality = this.networkQuality;
        const avgLoadTime = bandwidthTracker.getAverageLoadTime();

        // Sort sizes from smallest to largest
        const sizes = Object.entries(availableSizes)
            .sort((a, b) => parseInt(a[1]) - parseInt(b[1]));

        // Find the first size that's larger than the viewport
        const appropriateSize = sizes.find(([_, width]) => width >= viewportWidth);

        // If load times are too high, reduce quality
        if (avgLoadTime > 3000) {
            const index = sizes.indexOf(appropriateSize);
            return index > 0 ? sizes[index - 1][0] : sizes[0][0];
        }

        // Adjust based on network quality
        switch (quality) {
            case 'low':
                const index = sizes.indexOf(appropriateSize);
                return index > 0 ? sizes[index - 1][0] : sizes[0][0];
            case 'medium':
                return appropriateSize ? appropriateSize[0] : sizes[sizes.length - 1][0];
            case 'high':
                const nextIndex = sizes.indexOf(appropriateSize) + 1;
                return nextIndex < sizes.length ? sizes[nextIndex][0] : sizes[sizes.length - 1][0];
            default:
                return appropriateSize ? appropriateSize[0] : sizes[sizes.length - 1][0];
        }
    }

    // Preload critical images
    preloadCriticalImages() {
        const criticalImages = [
            '/static/images/PosterDojoPool.webp',
            '/static/images/logo.png',
            // Add other critical images here
        ];

        criticalImages.forEach(src => {
            if (!this.preloadedImages.has(src)) {
                const img = new Image();
                img.src = src;
                this.preloadedImages.add(src);
            }
        });
    }

    // Check AVIF support
    async supportsAVIF() {
        if (!self.createImageBitmap) return false;

        const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        try {
            const blob = await fetch(avifData).then(r => r.blob());
            return createImageBitmap(blob).then(() => true, () => false);
        } catch (e) {
            return false;
        }
    }

    // Load image with network-aware optimization and format support
    async loadImage(img) {
        // Get format support
        const [webpSupport, avifSupport] = await Promise.all([
            this.supportsWebP(),
            this.supportsAVIF()
        ]);

        // Get data attributes
        const avifSrc = img.dataset.avif ? JSON.parse(img.dataset.avif) : null;
        const webpSrc = img.dataset.webp ? JSON.parse(img.dataset.webp) : null;
        const src = img.dataset.src ? JSON.parse(img.dataset.src) : null;
        const sizes = img.dataset.sizes ? JSON.parse(img.dataset.sizes) : null;

        // Get appropriate size based on network conditions
        const appropriateSize = sizes ? this.getAppropriateSize(sizes) : null;

        // Add loading animation class
        img.classList.add('loading');

        // Start timing the load
        const startTime = performance.now();

        // Load handler
        const handleLoad = () => {
            const loadTime = performance.now() - startTime;
            img.classList.remove('loading');
            img.classList.add('loaded');

            // Track load statistics
            const size = parseInt(img.dataset.size || '0');
            bandwidthTracker.trackImageLoad(img.src, size, loadTime);
        };

        // Error handler
        const handleError = () => {
            img.classList.remove('loading');
            // If WebP fails, try original format
            if (img.src.includes('.webp') && src) {
                img.src = appropriateSize ? src[appropriateSize] : src;
            }
        };

        // Set up handlers
        img.onload = handleLoad;
        img.onerror = handleError;

        // Set source with format fallback
        if (avifSupport && avifSrc) {
            img.src = appropriateSize ? avifSrc[appropriateSize] : avifSrc;
        } else if (webpSupport && webpSrc) {
            img.src = appropriateSize ? webpSrc[appropriateSize] : webpSrc;
        } else {
            img.src = appropriateSize ? src[appropriateSize] : src;
        }

        // Store original sources for potential updates
        img.dataset.originalAvif = img.dataset.avif;
        img.dataset.originalWebp = img.dataset.webp;
        img.dataset.originalSrc = img.dataset.src;
        img.dataset.originalSizes = img.dataset.sizes;

        // Clean up data attributes
        img.removeAttribute('data-src');
        img.removeAttribute('data-webp');
        img.removeAttribute('data-avif');
        img.removeAttribute('data-sizes');
    }

    // Update already loaded images based on new network conditions
    async updateLoadedImages() {
        const [webpSupport, avifSupport] = await Promise.all([
            this.supportsWebP(),
            this.supportsAVIF()
        ]);

        document.querySelectorAll('img.loaded').forEach(img => {
            const originalSrc = img.dataset.originalSrc;
            const originalWebp = img.dataset.originalWebp;
            const originalAvif = img.dataset.originalAvif;
            const sizes = JSON.parse(img.dataset.originalSizes || '{}');

            if (originalSrc && sizes) {
                const appropriateSize = this.getAppropriateSize(sizes);
                let newSrc;

                if (avifSupport && originalAvif) {
                    newSrc = JSON.parse(originalAvif)[appropriateSize];
                } else if (webpSupport && originalWebp) {
                    newSrc = JSON.parse(originalWebp)[appropriateSize];
                } else {
                    newSrc = JSON.parse(originalSrc)[appropriateSize];
                }

                if (newSrc && img.src !== newSrc) {
                    img.src = newSrc;
                }
            }
        });
    }

    // Check WebP support
    async supportsWebP() {
        if (!self.createImageBitmap) return false;

        const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
        try {
            const blob = await fetch(webpData).then(r => r.blob());
            return createImageBitmap(blob).then(() => true, () => false);
        } catch (e) {
            return false;
        }
    }

    // Initialize lazy loading for images
    initLazyLoading() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            // Store original sources for potential updates
            img.dataset.originalSrc = img.dataset.src;
            img.dataset.originalWebp = img.dataset.webp;
            img.dataset.originalSizes = img.dataset.sizes;

            this.observer.observe(img);
        });
    }
}

// Initialize and export instance
const imageLoader = new ImageLoader();
export default imageLoader; 