import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ProfileService } from "../../../services/database/ProfileService";
import { applySecurity, validateInput } from "../../../middleware/security";
import { profileUpdateSchema } from "../../../validation/schemas";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Apply security measures
  applySecurity(req, res);

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const profile = await ProfileService.getProfile(session.user.id);
        if (!profile) {
          return res.status(404).json({ error: "Profile not found" });
        }
        return res.status(200).json(profile);
      } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" });
      }

    case "PUT":
      try {
        // Validate input
        await validateInput(profileUpdateSchema)(req, res, async () => {
          const profile = await ProfileService.updateProfile(
            session.user.id,
            req.body,
          );
          return res.status(200).json(profile);
        });
      } catch (error) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
