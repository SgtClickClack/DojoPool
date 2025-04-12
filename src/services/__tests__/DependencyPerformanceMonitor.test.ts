import DependencyPerformanceMonitor from '../DependencyPerformanceMonitor';

describe('DependencyPerformanceMonitor', () => {
    let monitor: DependencyPerformanceMonitor;

    beforeEach(() => {
        monitor = DependencyPerformanceMonitor.getInstance();
        monitor.stopMonitoring();
    });

    afterEach(() => {
        monitor.stopMonitoring();
    });

    test('should be a singleton', () => {
        const instance1 = DependencyPerformanceMonitor.getInstance();
        const instance2 = DependencyPerformanceMonitor.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('should start and stop monitoring', () => {
        monitor.startMonitoring();
        expect(monitor['updateInterval']).not.toBeNull();
        
        monitor.stopMonitoring();
        expect(monitor['updateInterval']).toBeNull();
    });

    test('should get loaded dependencies', () => {
        const dependencies = monitor['getLoadedDependencies']();
        expect(Array.isArray(dependencies)).toBe(true);
        expect(dependencies.length).toBeGreaterThan(0);
        expect(dependencies[0]).toHaveProperty('name');
        expect(dependencies[0]).toHaveProperty('version');
    });

    test('should measure load time', () => {
        const dep = { name: 'express' };
        const loadTime = monitor['measureLoadTime'](dep);
        expect(typeof loadTime).toBe('number');
    });

    test('should get metrics', () => {
        monitor.startMonitoring();
        const metrics = monitor.getMetrics();
        expect(metrics instanceof Map).toBe(true);
    });

    test('should get performance issues', () => {
        monitor.startMonitoring();
        const issues = monitor.getPerformanceIssues();
        expect(Array.isArray(issues)).toBe(true);
    });

    test('should handle invalid dependency', () => {
        const dep = { name: 'non-existent-package' };
        const loadTime = monitor['measureLoadTime'](dep);
        expect(loadTime).toBe(-1);
    });
}); 