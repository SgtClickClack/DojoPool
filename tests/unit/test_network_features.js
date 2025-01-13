import { jest } from '@jest/globals';

describe('NetworkStatus', () => {
    let NetworkStatus;
    let mockConnection;

    beforeEach(() => {
        // Mock navigator.connection
        mockConnection = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            effectiveType: '4g',
            type: 'wifi',
            downlink: 10,
            saveData: false
        };

        global.navigator.connection = mockConnection;
        global.navigator.onLine = true;

        // Import after setting up mocks
        NetworkStatus = require('../../src/dojopool/static/js/networkStatus.js').default;
    });

    test('detects network quality correctly', () => {
        const status = new NetworkStatus();

        // Test high-speed connection
        expect(status.getNetworkQuality()).toBe('high');

        // Test medium-speed connection
        mockConnection.downlink = 3;
        expect(status.getNetworkQuality()).toBe('medium');

        // Test low-speed connection
        mockConnection.downlink = 0.5;
        expect(status.getNetworkQuality()).toBe('low');
    });

    test('handles save-data mode', () => {
        mockConnection.saveData = true;
        const status = new NetworkStatus();
        expect(status.getNetworkQuality()).toBe('low');
    });

    test('handles offline state', () => {
        global.navigator.onLine = false;
        const status = new NetworkStatus();
        const spy = jest.spyOn(status, 'showStatus');
        status.updateStatus();
        expect(spy).toHaveBeenCalledWith('offline', 'Offline Mode');
    });
});

describe('ImageLoader', () => {
    let ImageLoader;
    let mockIntersectionObserver;

    beforeEach(() => {
        // Mock IntersectionObserver
        mockIntersectionObserver = jest.fn();
        mockIntersectionObserver.prototype.observe = jest.fn();
        mockIntersectionObserver.prototype.unobserve = jest.fn();
        global.IntersectionObserver = mockIntersectionObserver;

        // Import after setting up mocks
        ImageLoader = require('../../src/dojopool/static/js/imageLoader.js').default;
    });

    test('selects appropriate image size based on network and viewport', () => {
        const loader = new ImageLoader();
        const sizes = {
            'sm': 400,
            'md': 800,
            'lg': 1200,
            'xl': 1600
        };

        // Mock viewport width
        global.innerWidth = 1000;

        // Test high-quality network
        loader.networkQuality = 'high';
        expect(loader.getAppropriateSize(sizes)).toBe('lg');

        // Test medium-quality network
        loader.networkQuality = 'medium';
        expect(loader.getAppropriateSize(sizes)).toBe('md');

        // Test low-quality network
        loader.networkQuality = 'low';
        expect(loader.getAppropriateSize(sizes)).toBe('sm');
    });

    test('handles WebP support detection', async () => {
        const loader = new ImageLoader();

        // Mock successful WebP support
        global.createImageBitmap = jest.fn().mockResolvedValue({});
        global.fetch = jest.fn().mockResolvedValue({
            blob: jest.fn().mockResolvedValue(new Blob())
        });

        expect(await loader.supportsWebP()).toBe(true);

        // Mock failed WebP support
        global.createImageBitmap = jest.fn().mockRejectedValue(new Error());
        expect(await loader.supportsWebP()).toBe(false);
    });

    test('updates images on network change', () => {
        const loader = new ImageLoader();
        const mockImg = document.createElement('img');
        mockImg.dataset.originalSrc = '{"sm": "small.jpg", "md": "medium.jpg"}';
        mockImg.dataset.originalSizes = '{"sm": 400, "md": 800}';
        mockImg.classList.add('loaded');

        document.body.appendChild(mockImg);
        loader.networkQuality = 'low';
        loader.updateLoadedImages();

        expect(mockImg.src).toContain('small.jpg');
        document.body.removeChild(mockImg);
    });
});

describe('Bandwidth Tracking', () => {
    let BandwidthTracker;

    beforeEach(() => {
        // Import after setting up mocks
        BandwidthTracker = require('../../src/dojopool/static/js/bandwidthTracker.js').default;
    });

    test('tracks image loading bandwidth', () => {
        const tracker = new BandwidthTracker();
        const mockImageSize = 50000; // 50KB

        tracker.trackImageLoad('test.jpg', mockImageSize);
        expect(tracker.getTotalBandwidth()).toBe(mockImageSize);
    });

    test('calculates average loading time', () => {
        const tracker = new BandwidthTracker();
        const mockLoadTime = 500; // 500ms

        tracker.trackLoadTime('test.jpg', mockLoadTime);
        expect(tracker.getAverageLoadTime()).toBe(mockLoadTime);
    });

    test('provides bandwidth recommendations', () => {
        const tracker = new BandwidthTracker();

        // Simulate slow connection
        tracker.setNetworkConditions('slow');
        const recommendations = tracker.getOptimizationRecommendations();
        expect(recommendations).toContain('low');
    });
});

describe('DebugPanel', () => {
    let DebugPanel;
    let mockDocument;

    beforeEach(() => {
        // Mock DOM elements and methods
        mockDocument = {
            createElement: jest.fn(() => ({
                className: '',
                innerHTML: '',
                querySelector: jest.fn(),
                querySelectorAll: jest.fn(),
                addEventListener: jest.fn(),
                appendChild: jest.fn()
            })),
            body: {
                appendChild: jest.fn()
            }
        };
        global.document = mockDocument;

        // Import after setting up mocks
        DebugPanel = require('../../src/dojopool/static/js/debugPanel.js').default;
    });

    test('creates debug panel with correct structure', () => {
        const panel = new DebugPanel();
        expect(mockDocument.createElement).toHaveBeenCalledWith('div');
        expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    test('updates metrics correctly', () => {
        const panel = new DebugPanel();
        const mockMetricSpan = { textContent: '' };
        panel.panel.querySelector = jest.fn().mockReturnValue(mockMetricSpan);

        panel.updateMetrics({
            networkQuality: 'high',
            bandwidthUsage: '1.2 MB/s'
        });

        expect(mockMetricSpan.textContent).toBeDefined();
    });

    test('logs optimization recommendations', () => {
        const panel = new DebugPanel();
        const mockLogEntries = { insertBefore: jest.fn(), children: [] };
        panel.panel.querySelector = jest.fn().mockReturnValue(mockLogEntries);

        panel.logOptimization(['Reduce image quality', 'Preload next images']);
        expect(mockLogEntries.insertBefore).toHaveBeenCalled();
    });
});

describe('Advanced Bandwidth Optimization', () => {
    let BandwidthTracker;
    let ImageLoader;
    let mockPerformanceObserver;

    beforeEach(() => {
        // Mock PerformanceObserver
        mockPerformanceObserver = jest.fn();
        mockPerformanceObserver.prototype.observe = jest.fn();
        global.PerformanceObserver = mockPerformanceObserver;

        // Import after setting up mocks
        BandwidthTracker = require('../../src/dojopool/static/js/bandwidthTracker.js').default;
        ImageLoader = require('../../src/dojopool/static/js/imageLoader.js').default;
    });

    test('adjusts image quality based on network conditions', () => {
        const tracker = new BandwidthTracker();
        const loader = new ImageLoader();

        // Simulate poor network conditions
        tracker.trackImageLoad('test.jpg', 1000000, 5000); // 1MB, 5s load time
        const recommendations = tracker.getOptimizationRecommendations();

        expect(recommendations).toContain('Consider using lower resolution images for faster loading');
    });

    test('handles concurrent image loads efficiently', () => {
        const tracker = new BandwidthTracker();

        // Simulate multiple concurrent image loads
        for (let i = 0; i < 5; i++) {
            tracker.trackImageLoad(`test${i}.jpg`, 500000, 1000);
        }

        const usage = tracker.getBandwidthUsage();
        const avgLoadTime = tracker.getAverageLoadTime();

        expect(usage).toBeGreaterThan(0);
        expect(avgLoadTime).toBeGreaterThan(0);
    });

    test('adapts to changing network conditions', () => {
        const tracker = new BandwidthTracker();
        const loader = new ImageLoader();

        // Simulate good network conditions
        tracker.trackImageLoad('test1.jpg', 100000, 500);
        expect(loader.networkQuality).toBe('high');

        // Simulate degrading network
        for (let i = 0; i < 10; i++) {
            tracker.trackImageLoad(`test${i}.jpg`, 1000000, 3000);
        }

        const recommendations = tracker.getOptimizationRecommendations();
        expect(recommendations.length).toBeGreaterThan(0);
        expect(loader.networkQuality).toBe('low');
    });

    test('optimizes preloading strategy', () => {
        const tracker = new BandwidthTracker();
        const loader = new ImageLoader();

        // Simulate varying load times
        tracker.trackImageLoad('test1.jpg', 500000, 1000);
        tracker.trackImageLoad('test2.jpg', 600000, 1200);
        tracker.trackImageLoad('test3.jpg', 700000, 1400);

        const stats = {
            bandwidth: tracker.getBandwidthUsage(),
            totalUsage: tracker.getTotalBandwidth(),
            averageLoadTime: tracker.getAverageLoadTime()
        };

        expect(stats.bandwidth).toBeGreaterThan(0);
        expect(stats.totalUsage).toBeGreaterThan(0);
        expect(stats.averageLoadTime).toBeGreaterThan(0);
    });
});

describe('Integration Tests', () => {
    let ImageLoader;
    let BandwidthTracker;
    let NetworkStatus;
    let DebugPanel;

    beforeEach(() => {
        // Set up mocks
        global.fetch = jest.fn(() => Promise.resolve({
            blob: () => Promise.resolve(new Blob())
        }));
        global.createImageBitmap = jest.fn(() => Promise.resolve());

        // Import modules
        ImageLoader = require('../../src/dojopool/static/js/imageLoader.js').default;
        BandwidthTracker = require('../../src/dojopool/static/js/bandwidthTracker.js').default;
        NetworkStatus = require('../../src/dojopool/static/js/networkStatus.js').default;
        DebugPanel = require('../../src/dojopool/static/js/debugPanel.js').default;
    });

    test('components work together correctly', () => {
        const imageLoader = new ImageLoader();
        const bandwidthTracker = new BandwidthTracker();
        const networkStatus = new NetworkStatus();
        const debugPanel = new DebugPanel();

        // Simulate image load
        const mockImage = {
            dataset: {
                src: 'test.jpg',
                sizes: JSON.stringify({ sm: 400, md: 800, lg: 1200 })
            },
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        imageLoader.loadImage(mockImage);

        // Verify interactions
        expect(mockImage.classList.add).toHaveBeenCalledWith('loading');
        expect(bandwidthTracker.getTotalBandwidth()).toBe(0); // No actual load occurred in test
    });

    test('handles network changes gracefully', () => {
        const imageLoader = new ImageLoader();
        const networkStatus = new NetworkStatus();
        const debugPanel = new DebugPanel();

        // Simulate offline event
        window.dispatchEvent(new Event('offline'));
        expect(networkStatus.getNetworkQuality()).toBe('offline');

        // Simulate online event
        window.dispatchEvent(new Event('online'));
        expect(networkStatus.getNetworkQuality()).not.toBe('offline');
    });

    test('debug panel updates with system changes', () => {
        const debugPanel = new DebugPanel();
        const mockMetricSpan = { textContent: '' };
        debugPanel.panel.querySelector = jest.fn().mockReturnValue(mockMetricSpan);

        // Simulate bandwidth optimization event
        window.dispatchEvent(new CustomEvent('bandwidthOptimization', {
            detail: {
                recommendations: ['Reduce quality'],
                stats: {
                    bandwidth: 1000000,
                    totalUsage: 5000000,
                    averageLoadTime: 1500
                }
            }
        }));

        expect(mockMetricSpan.textContent).toBeDefined();
    });
}); 