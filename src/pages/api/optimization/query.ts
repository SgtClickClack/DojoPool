import { NextApiRequest, NextApiResponse } from "next";
import { QueryOptimizationService } from "../../../../dojopool/services/optimization/query";
import { getCurrentUser } from "../../../../dojopool/services/auth/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get query analysis
      const analysis = await QueryOptimizationService.get_query_analysis();
      return res.status(200).json(analysis);
    } else {
      // Analyze specific query
      const { query, action } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      let result;
      switch (action) {
        case "analyze":
          result = await QueryOptimizationService.analyze_query(query);
          break;
        case "optimize":
          result = await QueryOptimizationService.optimize_query(query);
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error processing query optimization:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
