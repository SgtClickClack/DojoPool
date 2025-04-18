import { NextApiRequest, NextApiResponse } from "next";
import { AnalyticsService } from "../../../../dojopool/services/analytics/service";
import { getCurrentUser } from "../../../../dojopool/services/auth/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse query parameters
    const { type, days } = req.query;
    const daysParam = days ? parseInt(days as string) : 30;

    // Get analytics based on type
    let analytics;
    switch (type) {
      case "shares":
        analytics = await AnalyticsService.get_share_analytics(
          undefined,
          daysParam,
        );
        break;
      case "social":
        analytics = await AnalyticsService.get_social_analytics(daysParam);
        break;
      case "performance":
        analytics = await AnalyticsService.get_performance_metrics();
        break;
      default:
        return res.status(400).json({ error: "Invalid analytics type" });
    }

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
