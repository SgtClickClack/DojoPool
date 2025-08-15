import { NextApiRequest, NextApiResponse } from "next";
import { FriendService } from "../../../../dojopool/services/social/friend";
import { getCurrentUser } from "../../../../dojopool/services/auth/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get request body
    const { friendship_id, action } = req.body;
    if (!friendship_id || typeof friendship_id !== "number") {
      return res.status(400).json({ error: "Friendship ID is required" });
    }
    if (!action || !["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Valid action (accept/reject) is required" });
    }

    // Handle friend request response
    const [success, error] =
      action === "accept"
        ? await FriendService.accept_friend_request(friendship_id, user.id)
        : await FriendService.reject_friend_request(friendship_id, user.id);

    if (!success) {
      return res.status(400).json({ error });
    }

    return res
      .status(200)
      .json({ message: `Friend request ${action}ed successfully` });
  } catch (error) {
    console.error("Error handling friend request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
