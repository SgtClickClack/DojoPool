declare module 'dojopool/services/cdn/cost_optimizer' {
  export class CDNCostOptimizer {
    constructor();
    optimize_costs(): Promise<{
      optimized: boolean;
      costs: {
        total_cost: number;
        bandwidth_cost: number;
        request_cost: number;
      };
      savings: number;
      optimization_time: number;
      timestamp: string;
    }>;
    generate_cost_report(): Promise<{
      optimization: {
        optimized: boolean;
        costs: {
          total_cost: number;
          bandwidth_cost: number;
          request_cost: number;
        };
        savings: number;
        optimization_time: number;
        timestamp: string;
      };
      usage: {
        hourly_usage: Record<number, number>;
        daily_usage: Record<string, number>;
        weekly_usage: Record<string, number>;
      };
      projections: {
        daily: Record<string, number>;
        weekly: Record<string, number>;
        monthly: Record<string, number>;
      };
      timestamp: string;
    }>;
  }
}

declare module 'dojopool/services/auth/session' {
  export function getCurrentUser(req: any): Promise<{
    id: string;
    email: string;
    role: string;
  } | null>;
} 