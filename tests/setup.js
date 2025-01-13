// Mock Chart.js
class Chart {
    constructor(ctx, config) {
        this.type = config.type;
        this.data = config.data;
        this.options = config.options;
        this._listeners = new Map();
    }

    update(type) {
        // Mock update method
    }

    destroy() {
        // Mock destroy method
    }

    addEventListener(type, listener) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, new Set());
        }
        this._listeners.get(type).add(listener);
    }

    removeEventListener(type, listener) {
        if (this._listeners.has(type)) {
            this._listeners.get(type).delete(listener);
        }
    }
}

global.Chart = Chart;

// Mock canvas context
const createContext = () => ({
    clearRect: () => { },
    fillRect: () => { },
    getImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
    }),
    putImageData: () => { },
    createImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
    }),
    setTransform: () => { },
    drawImage: () => { },
    save: () => { },
    fillText: () => { },
    restore: () => { },
    beginPath: () => { },
    moveTo: () => { },
    lineTo: () => { },
    closePath: () => { },
    stroke: () => { },
    strokeRect: () => { },
    setLineDash: () => { },
    scale: () => { },
    rotate: () => { },
    arc: () => { },
    fill: () => { },
    measureText: () => ({ width: 0, height: 0 }),
    transform: () => { },
    rect: () => { },
    clip: () => { }
});

// Mock HTMLCanvasElement
class HTMLCanvasElement extends HTMLElement {
    constructor() {
        super();
        this._context = null;
    }

    getContext(contextType) {
        if (!this._context) {
            this._context = createContext();
        }
        return this._context;
    }
}

global.HTMLCanvasElement = HTMLCanvasElement;

// Mock window.performance
const mockPerformance = {
    memory: {
        jsHeapSizeLimit: 2190000000,
        totalJSHeapSize: 21900000,
        usedJSHeapSize: 16300000
    },
    now: () => Date.now(),
    mark: () => { },
    measure: () => { },
    getEntriesByType: () => []
};

Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true
});

// Mock Network Information API
const mockConnection = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

Object.defineProperty(navigator, 'connection', {
    value: mockConnection,
    writable: true
});

// Mock ResizeObserver
class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.IntersectionObserver = IntersectionObserver;

// Set up DOM environment
document.body.innerHTML = `
    <div class="trend-visualization">
        <div class="trend-controls">
            <select class="time-range-select">
                <option value="5m">Last 5m</option>
                <option value="15m" selected>Last 15m</option>
                <option value="1h">Last 1h</option>
                <option value="4h">Last 4h</option>
            </select>
        </div>
        <div class="loadTime-trends trend-section">
            <div class="trend-direction"></div>
            <div class="trend-health"></div>
            <div class="analysis-stats"></div>
            <canvas id="loadTime-trend-chart"></canvas>
        </div>
        <div class="bandwidth-trends trend-section">
            <div class="trend-direction"></div>
            <div class="trend-health"></div>
            <div class="analysis-stats"></div>
            <canvas id="bandwidth-trend-chart"></canvas>
        </div>
        <div class="memory-trends trend-section">
            <div class="trend-direction"></div>
            <div class="trend-health"></div>
            <div class="analysis-stats"></div>
            <canvas id="memory-trend-chart"></canvas>
        </div>
    </div>
`; 