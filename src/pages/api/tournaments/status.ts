import { NextApiRequest, NextApiResponse } from "next";
import { TournamentService } from "../../../../dojopool/services/tournament/service";
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

    // Get tournament ID from query parameters
    const { tournament_id } = req.query;

    if (!tournament_id || typeof tournament_id !== "string") {
      return res.status(400).json({ error: "Tournament ID is required" });
    }

    // Get tournament status
    const status = await TournamentService.get_tournament_status(
      parseInt(tournament_id),
    );

    if ("error" in status) {
      return res.status(404).json({ error: status.error });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error("Error getting tournament status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
