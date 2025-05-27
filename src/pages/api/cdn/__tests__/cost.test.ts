import { testApiHandler } from 'next-test-api-route-handler';

import type { NextApiRequest, NextApiResponse } from 'next';
import handler from "../cost";
import { getCurrentUser } from "../../../../services/auth/session";
import { CDNCostOptimizer } from "../../../../services/cdn/cost_optimizer";

// Mock the auth and cost optimizer modules
jest.mock("../../../../services/auth/session"); // Ensure correct path
jest.mock("../../../../services/cdn/cost_optimizer"); // Ensure correct path

describe("CDN Cost API", () => {
  const mockUser = {
    id: "1",
    email: "test@example.com",
    role: "admin",
  };

  const mockCostReport = {
    optimization: {
      optimized: true,
      costs: {
        total_cost: 1000.0,
        bandwidth_cost: 600.0,
        request_cost: 400.0,
      },
      savings: 200.0,
      optimization_time: 1.5,
      timestamp: new Date().toISOString(),
    },
    usage: {
      hourly_usage: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        value: 100,
      })),
      daily_usage: { "2024-01-01": 2400 },
      weekly_usage: { "2024-W01": 16800 },
    },
    projections: {
      daily: { "2024-01-02": 2500 },
      weekly: { "2024-W02": 17500 },
      monthly: { "2024-01": 70000 },
    },
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 for unauthenticated requests", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(401);
        expect(json).toEqual({
          error: "Unauthorized",
        });
      },
    });
  });

  it("should return 405 for non-GET requests", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "POST" });
        const json = await response.json();
        expect(response.status).toBe(405);
        expect(json).toEqual({
          error: "Method not allowed",
        });
      },
    });
  });

  it("should return cost report for authenticated GET requests", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (
      CDNCostOptimizer.prototype.generate_cost_report as jest.Mock
    ).mockResolvedValue(mockCostReport);

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json).toEqual(mockCostReport);
      },
    });
  });

  it("should handle errors gracefully", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (
      CDNCostOptimizer.prototype.generate_cost_report as jest.Mock
    ).mockRejectedValue(new Error("Failed to generate cost report"));

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(500);
        expect(json).toEqual({
          error: "Failed to generate cost report",
        });
      },
    });
  });

  it("should validate user role", async () => {
    const nonAdminUser = {
      ...mockUser,
      role: "user",
    };
    (getCurrentUser as jest.Mock).mockResolvedValue(nonAdminUser);

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(403);
        expect(json).toEqual({
          error: "Insufficient permissions",
        });
      },
    });
  });
});
