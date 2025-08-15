import { NextApiRequest, NextApiResponse } from "next";
import { ActivityService } from "../../../../dojopool/services/social/activity";
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

    // Get query parameters
    const { page = "1", per_page = "20", types, days } = req.query;

    // Parse and validate parameters
    const pageNum = parseInt(page as string);
    const perPageNum = parseInt(per_page as string);
    const activityTypes = types ? (types as string).split(",") : undefined;
    const daysNum = days ? parseInt(days as string) : undefined;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page number" });
    }
    if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 100) {
      return res.status(400).json({ error: "Invalid per_page value" });
    }

    // Get feed activities
    const activities = await ActivityService.get_feed_activities(
      user.id,
      pageNum,
      perPageNum,
      activityTypes,
    );

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Error getting feed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
