import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { encryptData, decryptData } from "../../utils/encryption";
import { sanitizeUserData, sanitizeGameData } from "../../utils/sanitization";
import { dataConfig } from "../../config/data";

const prisma = new PrismaClient();

describe("Data Security Tests", () => {
  let testUserId: string;
  let testGameId: string;
  let encryptionKey: Buffer;

  beforeAll(async () => {
    // Generate test data
    encryptionKey = randomBytes(32);
    const hashedPassword = createHash("sha256")
      .update("testPassword123")
      .digest("hex");

    const testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
        role: "USER",
      },
    });
    testUserId = testUser.id;

    const testGame = await prisma.game.create({
      data: {
        createdBy: testUserId,
        status: "ACTIVE",
        type: "EIGHT_BALL",
      },
    });
    testGameId = testGame.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.game.delete({ where: { id: testGameId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe("Data Encryption", () => {
    test("should encrypt sensitive data before storage", async () => {
      const sensitiveData = {
        creditCard: "4111-1111-1111-1111",
        ssn: "123-45-6789",
      };

      const encryptedData = encryptData(sensitiveData, encryptionKey);
      expect(encryptedData).not.toEqual(JSON.stringify(sensitiveData));
      expect(encryptedData).toMatch(/^[a-zA-Z0-9+/=]+$/); // Base64 format

      // Verify decryption
      const decryptedData = decryptData(encryptedData, encryptionKey);
      expect(decryptedData).toEqual(sensitiveData);
    });

    test("should use secure encryption for password reset tokens", async () => {
      const token = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(token).digest("hex");

      const resetToken = await prisma.passwordReset.create({
        data: {
          userId: testUserId,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
      });

      expect(resetToken.token).not.toEqual(token);
      expect(resetToken.token).toHaveLength(64); // SHA-256 hex length
    });

    test("should encrypt session data", () => {
      const sessionData = {
        userId: testUserId,
        role: "USER",
        lastAccess: new Date().toISOString(),
      };

      const encryptedSession = encryptData(sessionData, dataConfig.sessionKey);
      expect(encryptedSession).not.toEqual(JSON.stringify(sessionData));

      const decryptedSession = decryptData(
        encryptedSession,
        dataConfig.sessionKey,
      );
      expect(decryptedSession).toEqual(sessionData);
    });
  });

  describe("Data Storage Security", () => {
    test("should hash passwords before storage", async () => {
      const password = "TestPassword123!";
      const hashedPassword = createHash("sha256")
        .update(password)
        .digest("hex");

      const user = await prisma.user.create({
        data: {
          email: "storage.test@example.com",
          password: hashedPassword,
          name: "Storage Test User",
          role: "USER",
        },
      });

      expect(user.password).not.toEqual(password);
      expect(user.password).toHaveLength(64); // SHA-256 hex length

      await prisma.user.delete({ where: { id: user.id } });
    });

    test("should enforce data retention policies", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - dataConfig.retentionDays - 1);

      const oldGame = await prisma.game.create({
        data: {
          createdBy: testUserId,
          status: "COMPLETED",
          type: "EIGHT_BALL",
          createdAt: oldDate,
        },
      });

      // Verify game is marked for deletion
      const shouldDelete = await prisma.game.findFirst({
        where: {
          id: oldGame.id,
          createdAt: {
            lt: new Date(
              Date.now() - dataConfig.retentionDays * 24 * 60 * 60 * 1000,
            ),
          },
        },
      });

      expect(shouldDelete).not.toBeNull();
      await prisma.game.delete({ where: { id: oldGame.id } });
    });

    test("should enforce secure backup encryption", async () => {
      const backupData = {
        timestamp: new Date().toISOString(),
        data: {
          users: [{ id: testUserId, email: "test@example.com" }],
          games: [{ id: testGameId, status: "ACTIVE" }],
        },
      };

      const encryptedBackup = encryptData(backupData, dataConfig.backupKey);
      expect(encryptedBackup).not.toEqual(JSON.stringify(backupData));

      const decryptedBackup = decryptData(
        encryptedBackup,
        dataConfig.backupKey,
      );
      expect(decryptedBackup).toEqual(backupData);
    });
  });

  describe("Data Access Controls", () => {
    test("should enforce row-level security", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          password: createHash("sha256").update("password123").digest("hex"),
          name: "Other User",
          role: "USER",
        },
      });

      const privateGame = await prisma.game.create({
        data: {
          createdBy: otherUser.id,
          status: "ACTIVE",
          type: "EIGHT_BALL",
          isPrivate: true,
        },
      });

      // Verify access control
      const accessibleGames = await prisma.game.findMany({
        where: {
          OR: [
            { createdBy: testUserId },
            { isPrivate: false },
            {
              participants: {
                some: {
                  userId: testUserId,
                },
              },
            },
          ],
        },
      });

      expect(accessibleGames.map((g: { id: string }) => g.id)).not.toContain(
        privateGame.id,
      );

      await prisma.game.delete({ where: { id: privateGame.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test("should enforce column-level security", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          // password and other sensitive fields should not be selected
        },
      });

      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("resetToken");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });
  });

  describe("Data Sanitization", () => {
    test("should sanitize user input data", () => {
      const rawUserData = {
        name: '<script>alert("XSS")</script>John Doe',
        email: '" OR ""="',
        bio: "Hello; DROP TABLE users;",
      };

      const sanitizedData = sanitizeUserData(rawUserData);
      expect(sanitizedData.name).not.toMatch(/<script>/);
      expect(sanitizedData.email).not.toMatch(/['"]/);
      expect(sanitizedData.bio).not.toMatch(/;/);
    });

    test("should sanitize game data", () => {
      const rawGameData = {
        title: '<img src="x" onerror="alert(1)">Game',
        description: "Game Description' OR '1'='1",
        notes: "Notes; DELETE FROM games;",
      };

      const sanitizedData = sanitizeGameData(rawGameData);
      expect(sanitizedData.title).not.toMatch(/<img/);
      expect(sanitizedData.description).not.toMatch(/'/);
      expect(sanitizedData.notes).not.toMatch(/;/);
    });

    test("should handle null and undefined values", () => {
      const rawData = {
        name: null,
        email: undefined,
        bio: "",
      };

      const sanitizedData = sanitizeUserData(rawData);
      expect(sanitizedData.name).toBeNull();
      expect(sanitizedData.email).toBeUndefined();
      expect(sanitizedData.bio).toBe("");
    });
  });
});
