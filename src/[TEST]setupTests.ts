import '@testing-library/jest-dom';

// Mock WebSocket
class MockWebSocket {
    static instances: MockWebSocket[] = [];
    onmessage: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    onopen: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    readyState: number = WebSocket.CONNECTING;
    url: string;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    send = jest.fn();
    close = jest.fn();
}

// Mock Worker
class MockWorker {
    static instances: MockWorker[] = [];
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor() {
        MockWorker.instances.push(this);
    }

    postMessage = jest.fn();
    terminate = jest.fn();
}

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now());
const mockRequestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
const mockCancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Set up global mocks
(global as any).WebSocket = MockWebSocket;
(global as any).Worker = MockWorker;
global.requestAnimationFrame = mockRequestAnimationFrame as any;
global.cancelAnimationFrame = mockCancelAnimationFrame as any;
global.performance.now = mockPerformanceNow;

// Mock Konva
jest.mock('konva', () => ({
    Stage: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        destroyChildren: jest.fn(),
        batchDraw: jest.fn(),
        toDataURL: jest.fn(() => ''),
        width: 800,
        height: 600
    })),
    Layer: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        remove: jest.fn(),
        destroyChildren: jest.fn(),
        batchDraw: jest.fn()
    })),
    Image: jest.fn().mockImplementation(({ image, width, height }) => ({
        image,
        width,
        height,
        setAttrs: jest.fn()
    }))
}));

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(100),
        width: 10,
        height: 10
    })),
    putImageData: jest.fn(),
    clearRect: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 50 })),
}));

// Reset all mocks between tests
beforeEach(() => {
    MockWebSocket.instances = [];
    MockWorker.instances = [];
    jest.clearAllMocks();
});

// Export mock classes for use in tests
export {
    MockWebSocket,
    MockWorker
};

