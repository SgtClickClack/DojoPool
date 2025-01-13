import { AuditLogger } from '../auditLogger';
import { AuthManager, UserRole } from '../auth';

jest.mock('../auth');

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockFetch: jest.Mock;
  let originalFetch: typeof fetch;
  let mockAuthManager: jest.Mocked<AuthManager>;

  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    roles: [UserRole.ADMIN],
    permissions: ['read', 'write'],
  };

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock AuthManager
    mockAuthManager = {
      getInstance: jest.fn().mockReturnThis(),
      getAuthenticatedUser: jest.fn().mockResolvedValue(mockUser),
      getAuthorizationHeader: jest.fn().mockReturnValue('Bearer test-token'),
    } as unknown as jest.Mocked<AuthManager>;

    (AuthManager.getInstance as jest.Mock).mockReturnValue(mockAuthManager);

    // Reset singleton instance
    (AuditLogger as any).instance = null;
    auditLogger = AuditLogger.getInstance({
      apiUrl: '/test/audit',
      batchSize: 2,
      flushInterval: 1000,
    });

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('logging operations', () => {
    it('should create audit event with user context', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await auditLogger.log('TEST', 'create', 'resource', { detail: 'test' });

      expect(mockAuthManager.getAuthenticatedUser).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('/test/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: expect.stringContaining('"type":"TEST"'),
      });
    });

    it('should batch events up to batchSize', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      // Log first event
      await auditLogger.log('TEST', 'action1', 'resource');
      expect(mockFetch).not.toHaveBeenCalled();

      // Log second event (should trigger flush due to batchSize = 2)
      await auditLogger.log('TEST', 'action2', 'resource');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events).toHaveLength(2);
      expect(requestBody.events[0].action).toBe('action1');
      expect(requestBody.events[1].action).toBe('action2');
    });

    it('should flush events on interval', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await auditLogger.log('TEST', 'action', 'resource');
      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry failed flush', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      await auditLogger.log('TEST', 'action1', 'resource');
      await auditLogger.log('TEST', 'action2', 'resource');

      expect(mockFetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][1].body).toBe(mockFetch.mock.calls[0][1].body);
    });
  });

  describe('specialized logging methods', () => {
    it('should log security events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await auditLogger.logSecurity('login', 'auth', { ip: '127.0.0.1' });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events[0]).toMatchObject({
        type: 'SECURITY',
        action: 'login',
        resource: 'auth',
        details: { ip: '127.0.0.1' },
      });
    });

    it('should log errors with immediate flush', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const error = new Error('Test error');
      await auditLogger.logError('TEST', 'action', 'resource', error);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events[0]).toMatchObject({
        type: 'TEST',
        status: 'failure',
        errorDetails: 'Test error',
      });
    });

    it('should log data access events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await auditLogger.logDataAccess('read', 'users', { query: { id: 123 } });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events[0]).toMatchObject({
        type: 'DATA_ACCESS',
        action: 'read',
        resource: 'users',
      });
    });

    it('should log system changes', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await auditLogger.logSystemChange('update', 'config', {
        changes: { setting: 'value' },
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events[0]).toMatchObject({
        type: 'SYSTEM_CHANGE',
        action: 'update',
        resource: 'config',
      });
    });
  });

  describe('audit log retrieval', () => {
    it('should fetch audit logs with filters', async () => {
      const mockLogs = [
        { id: '1', type: 'TEST', action: 'action1' },
        { id: '2', type: 'TEST', action: 'action2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLogs),
      });

      const logs = await auditLogger.getAuditLogs({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        type: 'TEST',
        userId: '123',
        limit: 10,
        offset: 0,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/audit/search?'),
        expect.any(Object)
      );

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.searchParams.get('type')).toBe('TEST');
      expect(url.searchParams.get('userId')).toBe('123');
      expect(url.searchParams.get('limit')).toBe('10');
      expect(url.searchParams.get('offset')).toBe('0');

      expect(logs).toEqual(mockLogs);
    });

    it('should handle audit log fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(auditLogger.getAuditLogs()).rejects.toThrow('Failed to fetch audit logs');
    });
  });
});
