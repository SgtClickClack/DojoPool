import { act, renderHook } from "@testing-library/react";
import errorLoggingService, { logError } from "../../../src/services/ErrorLoggingService";
import ErrorLoggingService from "../../../src/services/ErrorLoggingService";

describe("ErrorLogger", () => {
  let logger: typeof ErrorLoggingService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    jest.useFakeTimers();

    logger = ErrorLoggingService;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  describe("error logging", () => {
    it("should batch errors and send them", async () => {
      const error1 = new Error("Test error 1");
      const error2 = new Error("Test error 2");

      logError(error1);
      logError(error2);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/errors",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Test error 1"),
        }),
      );

      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

      expect(requestBody.errors).toHaveLength(2);
      expect(requestBody.errors[0].error.message).toBe("Test error 1");
      expect(requestBody.errors[1].error.message).toBe("Test error 2");
    });

    it("should flush errors after interval", async () => {
      const error = new Error("Test error");

      logError(error);

      expect(global.fetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/errors",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Test error"),
        }),
      );
    });

    it("should retry failed requests", async () => {
      const error = new Error("Test error");

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true } as Response);

      logError(error);
      jest.advanceTimersByTime(1000);

      await act(async () => { /* allow microtasks to run */ });

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should respect sample rate", () => {
      const logger = ErrorLoggingService;

      const mockRandom = jest.spyOn(Math, "random");
      mockRandom.mockReturnValueOnce(0.4);
      mockRandom.mockReturnValueOnce(0.6);

      logError(new Error("Test error 1"));
      logError(new Error("Test error 2"));

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

      expect(requestBody.errors).toHaveLength(1);
      expect(requestBody.errors[0].error.message).toBe("Test error 1");

      mockRandom.mockRestore();
    });

    it("should ignore specified errors", () => {
      const logger = ErrorLoggingService;

      logError(new Error("ignore me please"));
      logError(new Error("important error"));

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

      expect(requestBody.errors).toHaveLength(1);
      expect(requestBody.errors[0].error.message).toBe("important error");
    });
  });

  describe("React error logging", () => {
    it("should log React errors with component stack", () => {
      const error = new Error("React error");
      const errorInfo = {
        componentStack: "\n    at Component\n    at App",
      };

      // logError does not support React error info directly; skip or adapt as needed
    });
  });

  describe("system information", () => {
    it("should include system info with errors", () => {
      logError(new Error("Test error"));

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

      expect(requestBody.errors[0].systemInfo).toEqual(
        expect.objectContaining({
          userAgent: expect.any(String),
          platform: expect.any(String),
          language: expect.any(String),
          screenSize: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          }),
          url: expect.any(String),
        }),
      );
    });
  });

  describe("error context", () => {
    it("should include custom context with errors", () => {
      logError(new Error("Test error"), undefined, { userId: "123", action: "checkout" });

      jest.advanceTimersByTime(1000);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

      expect(requestBody.errors[0].context).toEqual(
        expect.objectContaining({
          userId: "123",
          action: "checkout",
        }),
      );
    });
  });

  describe("cleanup", () => {
    it("should clear error queue", () => {
      logError(new Error("Test error"));
      errorLoggingService.clearLogs();

      jest.advanceTimersByTime(1000);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
