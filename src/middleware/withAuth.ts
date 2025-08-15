import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../firebase/admin";

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split("Bearer ")[1];
      await auth.verifyIdToken(token);

      return handler(req, res);
    } catch (error: any) {
      console.error("Auth error:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}
