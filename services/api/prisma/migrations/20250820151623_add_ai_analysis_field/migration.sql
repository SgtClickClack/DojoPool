/*
  Warnings:

  - You are about to drop the column `tag` on the `Clan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN "aiAnalysisJson" TEXT;

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "venueId" TEXT,
    "tournamentId" TEXT,
    "matchId" TEXT,
    "clanId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clan" ("createdAt", "description", "id", "leaderId", "name", "updatedAt") SELECT "createdAt", "description", "id", "leaderId", "name", "updatedAt" FROM "Clan";
DROP TABLE "Clan";
ALTER TABLE "new_Clan" RENAME TO "Clan";
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");
CREATE TABLE "new_Territory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "clanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Territory_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Territory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Territory_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Territory" ("createdAt", "id", "name", "ownerId", "updatedAt", "venueId") SELECT "createdAt", "id", "name", "ownerId", "updatedAt", "venueId" FROM "Territory";
DROP TABLE "Territory";
ALTER TABLE "new_Territory" RENAME TO "Territory";
CREATE TABLE "new_Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "address" TEXT,
    "ownerId" TEXT,
    "controllingClanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Venue_controllingClanId_fkey" FOREIGN KEY ("controllingClanId") REFERENCES "Clan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Venue" ("address", "createdAt", "description", "id", "lat", "lng", "name", "ownerId", "updatedAt") SELECT "address", "createdAt", "description", "id", "lat", "lng", "name", "ownerId", "updatedAt" FROM "Venue";
DROP TABLE "Venue";
ALTER TABLE "new_Venue" RENAME TO "Venue";
CREATE INDEX "Venue_controllingClanId_idx" ON "Venue"("controllingClanId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
