export interface VenueAnalyticsData {
  totalRevenue: number;
  totalGames: number;
  averageOccupancy: number;
  peakHours: {
    [hour: string]: number;
  };
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
  gamesByDay: Array<{
    date: string;
    count: number;
  }>;
  tableUtilization: Array<{
    tableId: number;
    utilization: number;
  }>;
  maintenanceStats: {
    totalMaintenance: number;
    averageDuration: number;
    maintenanceByReason: {
      [reason: string]: number;
    };
  };
} 