import { NextApiRequest, NextApiResponse } from "next";
import { TwoFactorService } from "../../../../dojopool/services/auth/two_factor";
import { getCurrentUser } from "../../../../dojopool/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the temporary secret from the session
    const tempSecret = req.session.temp_2fa_secret;
    if (!tempSecret) {
      return res.status(400).json({ error: "2FA setup not initialized" });
    }

    // Enable 2FA with the verified secret
    const [success, error] = await TwoFactorService.enable_2fa(user);
    if (!success || error) {
      return res.status(500).json({ error: "Failed to enable 2FA" });
    }

    // Clear the temporary secret
    delete req.session.temp_2fa_secret;

    return res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
