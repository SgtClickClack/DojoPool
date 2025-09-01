/*
  Warnings:

  - A unique constraint covering the columns `[clanId,userId]` on the table `ClanMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,userId]` on the table `TournamentParticipant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tag` to the `Clan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN "expiresAt" DATETIME;

-- AlterTable
ALTER TABLE "TournamentParticipant" ADD COLUMN "finalRank" INTEGER;

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "data" JSONB NOT NULL,
    "venueId" TEXT,
    "matchId" TEXT,
    "tournamentId" TEXT,
    "clanId" TEXT,
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VenueQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" TEXT NOT NULL DEFAULT '',
    "rewardDojoCoins" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requirements" JSONB NOT NULL DEFAULT {},
    "type" TEXT NOT NULL DEFAULT 'DAILY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueQuest_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT,
    "venueId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "gameType" TEXT,
    "rules" JSONB NOT NULL DEFAULT {},
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" INTEGER,
    "playerIds" JSONB NOT NULL DEFAULT [],
    "currentPlayerId" TEXT,
    "ballStates" JSONB NOT NULL DEFAULT [],
    "fouls" JSONB NOT NULL DEFAULT {},
    "score" JSONB NOT NULL DEFAULT {},
    "events" JSONB NOT NULL DEFAULT [],
    "totalShots" INTEGER NOT NULL DEFAULT 0,
    "totalFouls" INTEGER NOT NULL DEFAULT 0,
    "totalFrames" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME,
    "winnerId" TEXT,
    "data" JSONB NOT NULL DEFAULT {},
    "frameCount" INTEGER NOT NULL DEFAULT 0,
    "shotCount" INTEGER NOT NULL DEFAULT 0,
    "foulCount" INTEGER NOT NULL DEFAULT 0,
    "shots" JSONB NOT NULL DEFAULT {},
    "statistics" JSONB NOT NULL DEFAULT {},
    "aiCommentary" JSONB NOT NULL DEFAULT {},
    "matchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameSession_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShadowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "cost" INTEGER NOT NULL,
    "reward" INTEGER,
    "completedAt" DATETIME,
    "initiatingClanId" TEXT,
    "targetVenueId" TEXT,
    "outcome" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShadowRun_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShadowRun_initiatingClanId_fkey" FOREIGN KEY ("initiatingClanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ShadowRun_targetVenueId_fkey" FOREIGN KEY ("targetVenueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DojoCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DojoCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DojoCheckIn_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VenueSpecial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VenueSpecial_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserInventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInventoryItem_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "MarketplaceItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "feedback_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Achievement" ("createdAt", "desc", "id", "key", "name", "points") SELECT "createdAt", "desc", "id", "key", "name", "points" FROM "Achievement";
DROP TABLE "Achievement";
ALTER TABLE "new_Achievement" RENAME TO "Achievement";
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tag" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "dojoCoinBalance" INTEGER NOT NULL DEFAULT 0,
    "seasonalPoints" INTEGER NOT NULL DEFAULT 0,
    "bannerUrl" TEXT,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clan" ("createdAt", "description", "id", "leaderId", "name", "updatedAt") SELECT "createdAt", "description", "id", "leaderId", "name", "updatedAt" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE UNIQUE INDEX "Clan_tag_key" ON "Clan"("tag");
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT,
    "venueId" TEXT,
    "tableId" TEXT,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "winnerId" TEXT,
    "loserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "round" INTEGER,
    "wager" INTEGER NOT NULL DEFAULT 0,
    "aiAnalysisJson" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "endedAt", "id", "playerAId", "playerBId", "scoreA", "scoreB", "startedAt", "status", "tableId", "tournamentId", "updatedAt", "venueId") SELECT "createdAt", "endedAt", "id", "playerAId", "playerBId", "scoreA", "scoreB", "startedAt", "status", "tableId", "tournamentId", "updatedAt", "venueId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "recipientId" TEXT,
    "title" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "payload", "read", "type", "userId") SELECT "createdAt", "id", "payload", "read", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_Territory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT,
    "clanId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "defenseScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Territory_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Territory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Territory_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Territory" ("clanId", "createdAt", "defenseScore", "id", "level", "ownerId", "updatedAt", "venueId") SELECT "clanId", "createdAt", "defenseScore", "id", "level", "ownerId", "updatedAt", "venueId" FROM "Territory";
DROP TABLE "Territory";
ALTER TABLE "new_Territory" RENAME TO "Territory";
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredBy" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "sponsorBannerUrl" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 8,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "rewards" TEXT,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tournament_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "endTime", "id", "name", "rewards", "startTime", "status", "updatedAt", "venueId") SELECT "createdAt", "endTime", "id", "name", "rewards", "startTime", "status", "updatedAt", "venueId" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "dojoCoinBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "address" TEXT,
    "ownerId" TEXT,
    "controllingClanId" TEXT,
    "incomeModifier" REAL NOT NULL DEFAULT 1.0,
    "defenseLevel" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "photos" JSONB NOT NULL DEFAULT [],
    "rating" REAL NOT NULL DEFAULT 0.0,
    "features" JSONB NOT NULL DEFAULT [],
    "tables" INTEGER NOT NULL DEFAULT 0,
    "reviews" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Venue" ("address", "createdAt", "description", "id", "lat", "lng", "name", "ownerId", "updatedAt") SELECT "address", "createdAt", "description", "id", "lat", "lng", "name", "ownerId", "updatedAt" FROM "Venue";
DROP TABLE "Venue";
ALTER TABLE "new_Venue" RENAME TO "Venue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "ClanMember_clanId_userId_key" ON "ClanMember"("clanId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");
