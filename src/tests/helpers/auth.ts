import { prisma } from "../../lib/prisma";
import { sign } from "jsonwebtoken";
import { hash } from "bcrypt";

interface TokenOptions {
  expiresIn?: string;
}

export async function createTestUser() {
  const hashedPassword = await hash("password", 10);

  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: "Test User",
    },
  });
}

export async function generateTestToken(
  userId: string,
  options: TokenOptions = {},
) {
  const { expiresIn = "1h" } = options;

  return sign({ userId }, process.env.JWT_SECRET || "test-secret", {
    expiresIn,
  });
}
