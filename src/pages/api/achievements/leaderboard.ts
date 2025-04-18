import { NextApiRequest, NextApiResponse } from "next";
import { AchievementService } from "../../../../dojopool/services/achievement/service";
import { getCurrentUser } from "../../../../dojopool/services/auth/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { limit = "10" } = req.query;

    // Parse and validate limit parameter
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: "Invalid limit value" });
    }

    // Get achievement leaderboard
    const leaderboard =
      await AchievementService.get_achievement_leaderboard(limitNum);

    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error retrieving achievement leaderboard:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
