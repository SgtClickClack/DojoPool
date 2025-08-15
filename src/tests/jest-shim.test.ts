import { describe, it, expect, beforeEach } from 'vitest';

describe('Jest Shim Compatibility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    global.jest.clearAllMocks();
  });

  it('should provide Jest-compatible APIs through global.jest', () => {
    // Test that Jest-compatible APIs are available
    expect(global.jest.fn).toBeDefined();
    expect(global.jest.mock).toBeDefined();
    expect(global.jest.unmock).toBeDefined();
    expect(global.jest.resetModules).toBeDefined();
    expect(global.jest.clearAllMocks).toBeDefined();
    expect(global.jest.restoreAllMocks).toBeDefined();
    expect(global.jest.resetAllMocks).toBeDefined();
    expect(global.jest.spyOn).toBeDefined();
    expect(global.jest.isMockFunction).toBeDefined();
    expect(global.jest.mocked).toBeDefined();
  });

  it('should not expose Vitest-specific APIs through global.jest', () => {
    // Test that Vitest-specific APIs are NOT exposed through global.jest
    expect(global.jest.expect).toBeUndefined();
    expect(global.jest.describe).toBeUndefined();
    expect(global.jest.it).toBeUndefined();
    expect(global.jest.test).toBeUndefined();
    expect(global.jest.beforeEach).toBeUndefined();
    expect(global.jest.afterEach).toBeUndefined();
    expect(global.jest.beforeAll).toBeUndefined();
    expect(global.jest.afterAll).toBeUndefined();
    expect(global.jest.expectTypeOf).toBeUndefined();
    expect(global.jest.assertType).toBeUndefined();
  });

  it('should allow creating mocks using global.jest.fn', () => {
    const mockFn = global.jest.fn();
    expect(mockFn).toBeDefined();
    expect(typeof mockFn).toBe('function');
    
    // Test that the mock can be called
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should allow clearing mocks using global.jest.clearAllMocks', () => {
    const mockFn = global.jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalled();
    
    global.jest.clearAllMocks();
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should maintain compatibility with existing test patterns', () => {
    // Test that the shim doesn't break existing test patterns
    const mockIntersectionObserver = new IntersectionObserver();
    expect(mockIntersectionObserver.observe).toBeDefined();
    expect(typeof mockIntersectionObserver.observe).toBe('function');
    
    const mockResizeObserver = new ResizeObserver();
    expect(mockResizeObserver.observe).toBeDefined();
    expect(typeof mockResizeObserver.observe).toBe('function');
  });

  it('should not expose spread operator issues', () => {
    // Test that there's no problematic spread operator usage
    const jestKeys = Object.keys(global.jest);
    const vitestKeys = Object.keys(vi);
    
    // Ensure Jest shim doesn't expose all Vitest properties
    expect(jestKeys.length).toBeLessThan(vitestKeys.length);
    
    // Verify only intended APIs are exposed
    const expectedJestAPIs = [
      'fn', 'mock', 'unmock', 'resetModules', 'clearAllMocks',
      'restoreAllMocks', 'resetAllMocks', 'spyOn', 'isMockFunction', 'mocked'
    ];
    
    expectedJestAPIs.forEach(api => {
      expect(jestKeys).toContain(api);
    });
  });
}); 