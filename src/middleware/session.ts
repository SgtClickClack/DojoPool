import { NextApiRequest, NextApiResponse } from "next";
import { SessionService } from "../dojopool/services/auth/session";
import { getCurrentUser } from "../dojopool/utils/auth";

export interface SessionRequest extends NextApiRequest {
  session?: any;
}

export function withSession(handler: Function) {
  return async (req: SessionRequest, res: NextApiResponse) => {
    try {
      // Skip session check for non-authenticated routes
      if (req.url?.includes("/api/auth/")) {
        return handler(req, res);
      }

      // Get session token from cookie
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ error: "No session token provided" });
      }

      // Validate session
      const session = await SessionService.validate_session(sessionToken);
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      // Get user
      const user = await getCurrentUser(req);
      if (!user || user.id !== session.user_id) {
        return res.status(401).json({ error: "User not found" });
      }

      // Refresh session
      await SessionService.refresh_session(session);

      // Attach session to request
      req.session = session;

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Session middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function requireSession(handler: Function) {
  return async (req: SessionRequest, res: NextApiResponse) => {
    try {
      // Get session token from cookie
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ error: "No session token provided" });
      }

      // Validate session
      const session = await SessionService.validate_session(sessionToken);
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      // Get user
      const user = await getCurrentUser(req);
      if (!user || user.id !== session.user_id) {
        return res.status(401).json({ error: "User not found" });
      }

      // Refresh session
      await SessionService.refresh_session(session);

      // Attach session to request
      req.session = session;

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Session middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
