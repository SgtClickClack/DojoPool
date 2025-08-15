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

    const { type, include_secret } = req.query;

    // Get achievements
    const achievements = await AchievementService.get_achievements(
      type as any,
      include_secret === "true",
    );

    return res.status(200).json(achievements);
  } catch (error) {
    console.error("Error retrieving achievements:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
