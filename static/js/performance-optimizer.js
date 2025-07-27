/**
 * Frontend Performance Optimizer
 * Handles client-side performance optimizations including:
 * - Timer cleanup
 * - Memory leak prevention
 * - Debouncing/throttling
 * - Resource management
 */

class PerformanceOptimizer {
    constructor() {
        this.timers = new Set();
        this.intervals = new Set();
        this.observers = new Set();
        this.eventListeners = new Map();
        this.abortControllers = new Set();
        
        // Setup cleanup on page unload
        this.setupCleanup();
        
        // Monitor performance
        this.startPerformanceMonitoring();
    }

    /**
     * Safe setTimeout that tracks timers for cleanup
     */
    setTimeout(callback, delay, ...args) {
        const timerId = setTimeout(() => {
            this.timers.delete(timerId);
            callback(...args);
        }, delay);
        
        this.timers.add(timerId);
        return timerId;
    }

    /**
     * Safe setInterval that tracks intervals for cleanup
     */
    setInterval(callback, delay, ...args) {
        const intervalId = setInterval(() => {
            callback(...args);
        }, delay);
        
        this.intervals.add(intervalId);
        return intervalId;
    }

    /**
     * Clear a specific timer
     */
    clearTimeout(timerId) {
        clearTimeout(timerId);
        this.timers.delete(timerId);
    }

    /**
     * Clear a specific interval
     */
    clearInterval(intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
    }

    /**
     * Debounce function to limit rapid function calls
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Throttle function to limit function calls to once per period
     */
    throttle(func, wait) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, wait);
            }
        };
    }

    /**
     * Add event listener with tracking for cleanup
     */
    addEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        const key = `${element}_${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push(handler);
    }

    /**
     * Remove tracked event listener
     */
    removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
        
        // Remove from tracking
        const key = `${element}_${event}`;
        if (this.eventListeners.has(key)) {
            const handlers = this.eventListeners.get(key);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Create an AbortController for fetch requests
     */
    createAbortController() {
        const controller = new AbortController();
        this.abortControllers.add(controller);
        return controller;
    }

    /**
     * Optimized fetch with timeout and cleanup
     */
    async fetch(url, options = {}) {
        const controller = this.createAbortController();
        const timeoutId = this.setTimeout(() => {
            controller.abort();
        }, options.timeout || 30000);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            this.clearTimeout(timeoutId);
            return response;
        } catch (error) {
            this.clearTimeout(timeoutId);
            throw error;
        } finally {
            this.abortControllers.delete(controller);
        }
    }

    /**
     * Lazy load images with Intersection Observer
     */
    lazyLoadImages(selector = 'img[data-src]') {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll(selector).forEach(img => {
                imageObserver.observe(img);
            });

            this.observers.add(imageObserver);
        }
    }

    /**
     * Memory usage monitoring
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    /**
     * Performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor page load performance
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        console.debug('Performance entry:', {
                            name: entry.name,
                            type: entry.entryType,
                            duration: Math.round(entry.duration),
                            startTime: Math.round(entry.startTime)
                        });
                    });
                });

                observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
                this.observers.add(observer);
            } catch (e) {
                console.warn('PerformanceObserver not supported:', e);
            }
        }

        // Monitor memory usage periodically
        this.setInterval(() => {
            const memory = this.getMemoryUsage();
            if (memory && memory.used > 50) { // Alert if using more than 50MB
                console.warn('High memory usage detected:', memory);
            }
        }, 60000); // Check every minute
    }

    /**
     * Optimize DOM operations with requestAnimationFrame
     */
    optimizeDOMUpdate(callback) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                callback();
                resolve();
            });
        });
    }

    /**
     * Batch DOM reads and writes
     */
    batchDOMOperations(reads = [], writes = []) {
        return new Promise(resolve => {
            // Batch all reads first
            reads.forEach(readFn => readFn());
            
            // Then batch all writes
            requestAnimationFrame(() => {
                writes.forEach(writeFn => writeFn());
                resolve();
            });
        });
    }

    /**
     * Setup cleanup on page unload
     */
    setupCleanup() {
        const cleanup = () => {
            this.cleanup();
        };

        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        
        // For Single Page Applications
        if ('addEventListener' in document) {
            document.addEventListener('turbo:before-cache', cleanup);
            document.addEventListener('turbo:before-visit', cleanup);
        }
    }

    /**
     * Cleanup all resources
     */
    cleanup() {
        console.debug('Cleaning up performance optimizer resources...');

        // Clear all timers
        this.timers.forEach(timerId => clearTimeout(timerId));
        this.timers.clear();

        // Clear all intervals
        this.intervals.forEach(intervalId => clearInterval(intervalId));
        this.intervals.clear();

        // Disconnect all observers
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();

        // Remove all tracked event listeners
        this.eventListeners.forEach((handlers, key) => {
            const [element, event] = key.split('_');
            handlers.forEach(handler => {
                if (element && element.removeEventListener) {
                    element.removeEventListener(event, handler);
                }
            });
        });
        this.eventListeners.clear();

        // Abort all pending requests
        this.abortControllers.forEach(controller => {
            controller.abort();
        });
        this.abortControllers.clear();

        console.debug('Performance optimizer cleanup completed');
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const memory = this.getMemoryUsage();
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
            memory,
            navigation: navigation ? {
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                totalTime: Math.round(navigation.loadEventEnd - navigation.navigationStart)
            } : null,
            resources: {
                tracked: {
                    timers: this.timers.size,
                    intervals: this.intervals.size,
                    observers: this.observers.size,
                    eventListeners: this.eventListeners.size,
                    abortControllers: this.abortControllers.size
                }
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Create global instance
window.performanceOptimizer = new PerformanceOptimizer();

// Replace global setTimeout/setInterval with tracked versions
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

window.setTimeout = function(callback, delay, ...args) {
    return window.performanceOptimizer.setTimeout(callback, delay, ...args);
};

window.setInterval = function(callback, delay, ...args) {
    return window.performanceOptimizer.setInterval(callback, delay, ...args);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

console.info('Frontend Performance Optimizer initialized');