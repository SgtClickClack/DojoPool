import { BaseManager } from "./base-manager";

export interface NetworkRequestInfo {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  size?: number;
  type?: string;
  success: boolean;
  error?: string;
}

export interface NetworkStats {
  totalRequests: number;
  activeRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytes: number;
  averageLatency: number;
  p95Latency: number;
  errorRate: number;
}

export interface NetworkMetrics {
  stats: NetworkStats;
  requestHistory: NetworkRequestInfo[];
  byEndpoint: Map<
    string,
    {
      count: number;
      averageLatency: number;
      errorRate: number;
      totalBytes: number;
    }
  >;
}

export class NetworkProfiler extends BaseManager<NetworkProfiler> {
  private requests: Map<string, NetworkRequestInfo> = new Map();
  private history: NetworkRequestInfo[] = [];
  private readonly maxHistory: number = 1000;
  private originalFetch: typeof fetch;
  private originalXHR: typeof XMLHttpRequest;

  protected constructor() {
    super();
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
    this.initializeInterceptors();
  }

  public static override getInstance(): NetworkProfiler {
    return BaseManager.getInstance.call(NetworkProfiler);
  }

  private initializeInterceptors(): void {
    this.interceptFetch();
    this.interceptXHR();
  }

  private interceptFetch(): void {
    const self = this;
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const requestId = crypto.randomUUID();
      const url = typeof input === "string" ? input : input.url;
      const method =
        init?.method || (input instanceof Request ? input.method : "GET");

      const requestInfo: NetworkRequestInfo = {
        url,
        method,
        startTime: performance.now(),
        success: false,
      };

      self.requests.set(requestId, requestInfo);

      try {
        const response = await self.originalFetch.apply(window, [input, init]);
        const clonedResponse = response.clone();
        const blob = await clonedResponse.blob();

        requestInfo.endTime = performance.now();
        requestInfo.duration = requestInfo.endTime - requestInfo.startTime;
        requestInfo.status = response.status;
        requestInfo.size = blob.size;
        requestInfo.type = response.headers.get("content-type") || undefined;
        requestInfo.success = response.ok;

        self.addToHistory(requestId, requestInfo);

        return response;
      } catch (error) {
        requestInfo.endTime = performance.now();
        requestInfo.duration = requestInfo.endTime - requestInfo.startTime;
        requestInfo.success = false;
        requestInfo.error =
          error instanceof Error ? error.message : "Unknown error";

        self.addToHistory(requestId, requestInfo);
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const self = this;
    const XHR = window.XMLHttpRequest;

    window.XMLHttpRequest = function () {
      const xhr = new self.originalXHR();
      const requestId = crypto.randomUUID();
      let requestInfo: NetworkRequestInfo = {
        url: "",
        method: "",
        startTime: 0,
        success: false,
      };

      const open = xhr.open;
      xhr.open = function (method: string, url: string | URL) {
        requestInfo.method = method;
        requestInfo.url = url.toString();
        return open.apply(xhr, arguments as any);
      };

      xhr.addEventListener("loadstart", () => {
        requestInfo.startTime = performance.now();
        self.requests.set(requestId, requestInfo);
      });

      xhr.addEventListener("loadend", () => {
        requestInfo.endTime = performance.now();
        requestInfo.duration = requestInfo.endTime - requestInfo.startTime;
        requestInfo.status = xhr.status;
        requestInfo.size = parseInt(
          xhr.getResponseHeader("content-length") || "0",
          10,
        );
        requestInfo.type = xhr.getResponseHeader("content-type") || undefined;
        requestInfo.success = xhr.status >= 200 && xhr.status < 300;

        self.addToHistory(requestId, requestInfo);
      });

      xhr.addEventListener("error", () => {
        requestInfo.endTime = performance.now();
        requestInfo.duration = requestInfo.endTime - requestInfo.startTime;
        requestInfo.success = false;
        requestInfo.error = "Network error";

        self.addToHistory(requestId, requestInfo);
      });

      return xhr;
    } as any;

    window.XMLHttpRequest.prototype = self.originalXHR.prototype;
  }

  private addToHistory(requestId: string, info: NetworkRequestInfo): void {
    this.requests.delete(requestId);
    this.history.push(info);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  public getMetrics(): NetworkMetrics {
    const completedRequests = this.history.filter(
      (r) => r.endTime !== undefined,
    );
    const durations = completedRequests.map((r) => r.duration!);
    const successfulRequests = completedRequests.filter((r) => r.success);

    // Calculate stats
    const stats: NetworkStats = {
      totalRequests: this.history.length,
      activeRequests: this.requests.size,
      successfulRequests: successfulRequests.length,
      failedRequests: completedRequests.length - successfulRequests.length,
      totalBytes: completedRequests.reduce((sum, r) => sum + (r.size || 0), 0),
      averageLatency: this.average(durations),
      p95Latency: this.percentile(durations, 95),
      errorRate:
        completedRequests.length > 0
          ? (completedRequests.length - successfulRequests.length) /
            completedRequests.length
          : 0,
    };

    // Calculate per-endpoint metrics
    const byEndpoint = new Map<
      string,
      {
        count: number;
        averageLatency: number;
        errorRate: number;
        totalBytes: number;
      }
    >();

    completedRequests.forEach((request) => {
      const endpoint = new URL(request.url).pathname;
      const current = byEndpoint.get(endpoint) || {
        count: 0,
        averageLatency: 0,
        errorRate: 0,
        totalBytes: 0,
      };

      current.count++;
      current.averageLatency =
        (current.averageLatency * (current.count - 1) + request.duration!) /
        current.count;
      current.errorRate =
        ((current.count - 1) * current.errorRate) / current.count +
        (request.success ? 0 : 1) / current.count;
      current.totalBytes += request.size || 0;

      byEndpoint.set(endpoint, current);
    });

    return {
      stats,
      requestHistory: [...this.history],
      byEndpoint,
    };
  }

  private average(values: number[]): number {
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const pos = ((sorted.length - 1) * p) / 100;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }

  public override cleanup(): void {
    // Restore original fetch and XHR
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;

    this.requests.clear();
    this.history = [];
    this.onCleanup();
  }
}
