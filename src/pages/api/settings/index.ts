import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { UserSettingsService } from "../../../services/database/UserSettingsService";
import { applySecurity, validateInput } from "../../../middleware/security";
import { z } from "zod";

// Settings update schema
const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  privacySettings: z
    .object({
      profileVisibility: z.enum(["public", "friends", "private"]).optional(),
      activityVisibility: z.enum(["public", "friends", "private"]).optional(),
      allowFriendRequests: z.boolean().optional(),
      allowMessages: z.boolean().optional(),
    })
    .optional(),
  notificationSettings: z
    .object({
      gameInvites: z.boolean().optional(),
      friendRequests: z.boolean().optional(),
      achievements: z.boolean().optional(),
      tournamentUpdates: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    })
    .optional(),
});

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
        const settings = await UserSettingsService.getSettings(session.user.id);
        if (!settings) {
          return res.status(404).json({ error: "Settings not found" });
        }
        return res.status(200).json(settings);
      } catch (error) {
        return res.status(500).json({ error: "Failed to fetch settings" });
      }

    case "PUT":
      try {
        // Validate input
        await validateInput(settingsUpdateSchema)(req, res, async () => {
          const settings = await UserSettingsService.updateSettings(
            session.user.id,
            req.body,
          );
          return res.status(200).json(settings);
        });
      } catch (error) {
        return res.status(500).json({ error: "Failed to update settings" });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
