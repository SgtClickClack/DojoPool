import { NextApiRequest, NextApiResponse } from "next";
import { AlertHistoryService } from "../../../services/AlertHistoryService";

const alertHistoryService = new AlertHistoryService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const { type, metric, status, startDate, endDate, minImpactScore, tags } =
        req.query;

      const query = {
        type: type as "regression" | "violation" | "warning" | undefined,
        metric: metric as string | undefined,
        status: status as "open" | "acknowledged" | "resolved" | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minImpactScore: minImpactScore
          ? parseFloat(minImpactScore as string)
          : undefined,
        tags: tags ? (tags as string).split(",") : undefined,
      };

      const alerts = await alertHistoryService.getAlerts(query);
      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      const { alertId, status, userId, resolution } = req.body;

      if (!alertId || !status || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updatedAlert = await alertHistoryService.updateAlertStatus(
        alertId,
        status,
        userId,
        resolution,
      );

      if (!updatedAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      return res.status(200).json(updatedAlert);
    } catch (error) {
      console.error("Error updating alert:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
