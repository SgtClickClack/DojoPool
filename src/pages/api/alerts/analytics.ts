import { NextApiRequest, NextApiResponse } from "next";
import { AlertHistoryService } from "../../../services/AlertHistoryService";

const alertHistoryService = new AlertHistoryService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { startDate: startDateStr, endDate: endDateStr } = req.query;

    if (!startDateStr || !endDateStr) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const startDate = new Date(startDateStr as string);
    const endDate = new Date(endDateStr as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (startDate > endDate) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    const analytics = await alertHistoryService.getAlertAnalytics(
      startDate,
      endDate,
    );
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching alert analytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
