// Dashboard DTOs shared between frontend and backend
export interface DashboardStats {
  dojoCoinBalance: number;
  matches: {
    wins: number;
    losses: number;
    total: number;
  };
  tournaments: {
    joined: number;
  };
}

export interface CdnCostBreakdownDay {
  date: string; // YYYY-MM-DD
  gb: number; // bandwidth in GB
  cost: number; // cost in USD for the day
}

export interface CdnCostResponse {
  period: string; // e.g., "Last 30 Days"
  totalBandwidthGB: number;
  totalCostUSD: number;
  dailyBreakdown: CdnCostBreakdownDay[];
}
