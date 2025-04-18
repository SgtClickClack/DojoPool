import { AlertHistory, IAlertHistory } from "../models/AlertHistory";
import { PerformanceAlert } from "./notifications/PerformanceNotificationService";
import { Types } from "mongoose";

interface AlertDocument {
  _id: Types.ObjectId;
}

export interface AlertHistoryQuery {
  type?: "regression" | "violation" | "warning";
  metric?: string;
  status?: "open" | "acknowledged" | "resolved";
  startDate?: Date;
  endDate?: Date;
  minImpactScore?: number;
  tags?: string[];
}

export interface AlertAnalytics {
  totalAlerts: number;
  openAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  averageTimeToAcknowledge: number;
  averageTimeToResolve: number;
  alertsByType: Record<string, number>;
  alertsByMetric: Record<string, number>;
  topImpactingAlerts: IAlertHistory[];
  recentTrends: {
    date: Date;
    count: number;
    avgImpactScore: number;
  }[];
}

export class AlertHistoryService {
  async createAlert(
    alert: PerformanceAlert,
    notificationsSent: { email: boolean; slack: boolean; sns: boolean },
  ): Promise<IAlertHistory> {
    const alertHistory = new AlertHistory({
      ...alert,
      notificationsSent,
      status: "open",
      timestamp: new Date(alert.timestamp),
    });

    await this.findAndLinkRelatedAlerts(alertHistory);
    return alertHistory.save();
  }

  private async findAndLinkRelatedAlerts(alert: IAlertHistory): Promise<void> {
    // Find alerts for the same metric in the last 24 hours
    const relatedAlerts = await AlertHistory.find({
      metric: alert.metric,
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        $lt: alert.timestamp,
      },
      _id: { $ne: alert._id },
    })
      .select("_id")
      .lean<AlertDocument[]>();

    alert.relatedAlerts = relatedAlerts.map((a) => a._id.toString());
  }

  async updateAlertStatus(
    alertId: string,
    status: "acknowledged" | "resolved",
    userId: string,
    resolution?: string,
  ): Promise<IAlertHistory | null> {
    const update: Partial<IAlertHistory> = {
      status,
      resolution,
    };

    if (status === "acknowledged") {
      update.acknowledgedBy = userId;
      update.acknowledgedAt = new Date();
    } else if (status === "resolved") {
      update.resolvedBy = userId;
      update.resolvedAt = new Date();
    }

    return AlertHistory.findByIdAndUpdate(alertId, update, { new: true });
  }

  async getAlerts(query: AlertHistoryQuery): Promise<IAlertHistory[]> {
    const filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.metric) filter.metric = query.metric;
    if (query.status) filter.status = query.status;
    if (query.minImpactScore)
      filter.impactScore = { $gte: query.minImpactScore };
    if (query.tags?.length) filter.tags = { $in: query.tags };

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = query.startDate;
      if (query.endDate) filter.timestamp.$lte = query.endDate;
    }

    return AlertHistory.find(filter)
      .sort({ timestamp: -1, impactScore: -1 })
      .populate("relatedAlerts");
  }

  async getAlertAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<AlertAnalytics> {
    const [
      totalAlerts,
      statusCounts,
      timeMetrics,
      typeDistribution,
      metricDistribution,
      topAlerts,
      dailyTrends,
    ] = await Promise.all([
      AlertHistory.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
      }),
      this.getStatusCounts(startDate, endDate),
      this.getTimeMetrics(startDate, endDate),
      this.getAlertDistribution("type", startDate, endDate),
      this.getAlertDistribution("metric", startDate, endDate),
      this.getTopImpactingAlerts(startDate, endDate),
      this.getDailyTrends(startDate, endDate),
    ]);

    return {
      totalAlerts,
      ...statusCounts,
      ...timeMetrics,
      alertsByType: typeDistribution,
      alertsByMetric: metricDistribution,
      topImpactingAlerts: topAlerts,
      recentTrends: dailyTrends,
    };
  }

  private async getStatusCounts(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    openAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
  }> {
    const result = await AlertHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = { openAlerts: 0, acknowledgedAlerts: 0, resolvedAlerts: 0 };
    result.forEach(({ _id, count }) => {
      switch (_id) {
        case "open":
          counts.openAlerts = count;
          break;
        case "acknowledged":
          counts.acknowledgedAlerts = count;
          break;
        case "resolved":
          counts.resolvedAlerts = count;
          break;
      }
    });

    return counts;
  }

  private async getTimeMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageTimeToAcknowledge: number;
    averageTimeToResolve: number;
  }> {
    const result = await AlertHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          $or: [
            { acknowledgedAt: { $exists: true } },
            { resolvedAt: { $exists: true } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          avgAckTime: {
            $avg: {
              $subtract: ["$acknowledgedAt", "$timestamp"],
            },
          },
          avgResolveTime: {
            $avg: {
              $subtract: ["$resolvedAt", "$timestamp"],
            },
          },
        },
      },
    ]);

    return {
      averageTimeToAcknowledge: result[0]?.avgAckTime || 0,
      averageTimeToResolve: result[0]?.avgResolveTime || 0,
    };
  }

  private async getAlertDistribution(
    field: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const result = await AlertHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 },
        },
      },
    ]);

    return result.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async getTopImpactingAlerts(
    startDate: Date,
    endDate: Date,
  ): Promise<IAlertHistory[]> {
    return AlertHistory.find({
      timestamp: { $gte: startDate, $lte: endDate },
    })
      .sort({ impactScore: -1 })
      .limit(10);
  }

  private async getDailyTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<
    {
      date: Date;
      count: number;
      avgImpactScore: number;
    }[]
  > {
    return AlertHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          count: { $sum: 1 },
          avgImpactScore: { $avg: "$impactScore" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromString: { dateString: "$_id" } },
          count: 1,
          avgImpactScore: 1,
        },
      },
    ]);
  }
}
