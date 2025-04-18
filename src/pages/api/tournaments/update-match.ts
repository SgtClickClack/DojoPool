import { NextApiRequest, NextApiResponse } from "next";
import { TournamentService } from "../../../../dojopool/services/tournament/service";
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

    // Validate request body
    const { match_id, winner_id, score } = req.body;

    if (!match_id || !winner_id || !score) {
      return res
        .status(400)
        .json({ error: "Match ID, winner ID, and score are required" });
    }

    // Update match result
    const [success, match, error] = await TournamentService.update_match_result(
      match_id,
      winner_id,
      score,
    );

    if (!success || !match) {
      return res
        .status(400)
        .json({ error: error || "Failed to update match result" });
    }

    return res.status(200).json(match.to_dict());
  } catch (error) {
    console.error("Error updating match result:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
