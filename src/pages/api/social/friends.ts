import { NextApiRequest, NextApiResponse } from "next";
import { FriendService } from "../../../../dojopool/services/social/friend";
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
    const { type = "all" } = req.query;
    if (!["all", "pending", "blocked"].includes(type as string)) {
      return res.status(400).json({ error: "Invalid type parameter" });
    }

    // Get friends based on type
    let friends;
    switch (type) {
      case "pending":
        friends = await FriendService.get_pending_requests(user.id);
        break;
      case "blocked":
        friends = await FriendService.get_blocked_users(user.id);
        break;
      default:
        friends = await FriendService.get_friends(user.id);
    }

    return res.status(200).json(friends);
  } catch (error) {
    console.error("Error getting friends:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
