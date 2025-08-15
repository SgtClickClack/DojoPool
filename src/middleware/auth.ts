import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth/AuthService";

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const decoded = AuthService.verifyToken(token);
    request.headers.set("user-id", decoded.id);
    request.headers.set("user-role", decoded.role);

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/api/game/:path*",
    "/api/tournament/:path*",
    "/api/venue/:path*",
    "/api/user/:path*",
  ],
};
