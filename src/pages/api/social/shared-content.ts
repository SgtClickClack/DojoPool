import { NextApiRequest, NextApiResponse } from "next";
import { ShareService } from "../../../../dojopool/services/social/share";
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

    const { content_type, content_id, page = "1", per_page = "20" } = req.query;

    // Validate required parameters
    if (!content_type || !content_id) {
      return res
        .status(400)
        .json({ error: "Content type and ID are required" });
    }

    // Validate content type
    const validTypes = [
      "game",
      "tournament",
      "achievement",
      "profile",
      "shot",
      "venue",
    ];
    if (!validTypes.includes(content_type as string)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    // Parse and validate pagination parameters
    const pageNum = parseInt(page as string);
    const perPageNum = parseInt(per_page as string);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page number" });
    }
    if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 100) {
      return res.status(400).json({ error: "Invalid per_page value" });
    }

    // Get shared content
    const shares = await ShareService.get_shared_content(
      content_type as any,
      parseInt(content_id as string),
      pageNum,
      perPageNum,
    );

    return res.status(200).json(shares);
  } catch (error) {
    console.error("Error retrieving shared content:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
