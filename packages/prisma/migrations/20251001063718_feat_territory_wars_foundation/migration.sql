-- CreateEnum
CREATE TYPE "WarStatus" AS ENUM ('PEACE', 'IMMINENT_WAR', 'ACTIVE_WAR');

-- AlterTable
ALTER TABLE "Territory" ADD COLUMN     "controllingClanId" TEXT,
ADD COLUMN     "warStatus" "WarStatus" NOT NULL DEFAULT 'PEACE';

-- CreateTable
CREATE TABLE "War" (
    "id" TEXT NOT NULL,
    "attackingClanId" TEXT NOT NULL,
    "defendingClanId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "status" "WarStatus" NOT NULL DEFAULT 'PEACE',
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "winnerClanId" TEXT,
    "warType" TEXT NOT NULL DEFAULT 'TERRITORY',
    "stakes" TEXT NOT NULL DEFAULT '{}',
    "rules" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "War_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarParticipant" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SOLDIER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "performance" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarBattle" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "battleType" TEXT NOT NULL DEFAULT 'POOL_MATCH',
    "score" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarEvent" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "battleId" TEXT,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "clanAId" TEXT NOT NULL,
    "clanBId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DEFENSIVE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "terms" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarLog" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "War_status_idx" ON "War"("status");

-- CreateIndex
CREATE INDEX "War_attackingClanId_idx" ON "War"("attackingClanId");

-- CreateIndex
CREATE INDEX "War_defendingClanId_idx" ON "War"("defendingClanId");

-- CreateIndex
CREATE INDEX "War_territoryId_idx" ON "War"("territoryId");

-- CreateIndex
CREATE INDEX "War_declaredAt_idx" ON "War"("declaredAt");

-- CreateIndex
CREATE INDEX "WarParticipant_warId_idx" ON "WarParticipant"("warId");

-- CreateIndex
CREATE INDEX "WarParticipant_userId_idx" ON "WarParticipant"("userId");

-- CreateIndex
CREATE INDEX "WarParticipant_clanId_idx" ON "WarParticipant"("clanId");

-- CreateIndex
CREATE UNIQUE INDEX "WarParticipant_warId_userId_key" ON "WarParticipant"("warId", "userId");

-- CreateIndex
CREATE INDEX "WarBattle_warId_idx" ON "WarBattle"("warId");

-- CreateIndex
CREATE INDEX "WarBattle_attackerId_idx" ON "WarBattle"("attackerId");

-- CreateIndex
CREATE INDEX "WarBattle_defenderId_idx" ON "WarBattle"("defenderId");

-- CreateIndex
CREATE INDEX "WarBattle_territoryId_idx" ON "WarBattle"("territoryId");

-- CreateIndex
CREATE INDEX "WarBattle_status_idx" ON "WarBattle"("status");

-- CreateIndex
CREATE INDEX "WarEvent_warId_idx" ON "WarEvent"("warId");

-- CreateIndex
CREATE INDEX "WarEvent_battleId_idx" ON "WarEvent"("battleId");

-- CreateIndex
CREATE INDEX "WarEvent_type_idx" ON "WarEvent"("type");

-- CreateIndex
CREATE INDEX "WarEvent_timestamp_idx" ON "WarEvent"("timestamp");

-- CreateIndex
CREATE INDEX "Alliance_clanAId_idx" ON "Alliance"("clanAId");

-- CreateIndex
CREATE INDEX "Alliance_clanBId_idx" ON "Alliance"("clanBId");

-- CreateIndex
CREATE INDEX "Alliance_status_idx" ON "Alliance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_clanAId_clanBId_key" ON "Alliance"("clanAId", "clanBId");

-- CreateIndex
CREATE INDEX "WarLog_warId_idx" ON "WarLog"("warId");

-- CreateIndex
CREATE INDEX "WarLog_eventType_idx" ON "WarLog"("eventType");

-- CreateIndex
CREATE INDEX "WarLog_timestamp_idx" ON "WarLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_controllingClanId_fkey" FOREIGN KEY ("controllingClanId") REFERENCES "Clan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "War" ADD CONSTRAINT "War_attackingClanId_fkey" FOREIGN KEY ("attackingClanId") REFERENCES "Clan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "War" ADD CONSTRAINT "War_defendingClanId_fkey" FOREIGN KEY ("defendingClanId") REFERENCES "Clan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "War" ADD CONSTRAINT "War_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarParticipant" ADD CONSTRAINT "WarParticipant_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarParticipant" ADD CONSTRAINT "WarParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarParticipant" ADD CONSTRAINT "WarParticipant_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarBattle" ADD CONSTRAINT "WarBattle_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarBattle" ADD CONSTRAINT "WarBattle_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "WarParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarBattle" ADD CONSTRAINT "WarBattle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "WarParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarBattle" ADD CONSTRAINT "WarBattle_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarEvent" ADD CONSTRAINT "WarEvent_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarEvent" ADD CONSTRAINT "WarEvent_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "WarBattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_clanAId_fkey" FOREIGN KEY ("clanAId") REFERENCES "Clan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alliance" ADD CONSTRAINT "Alliance_clanBId_fkey" FOREIGN KEY ("clanBId") REFERENCES "Clan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarLog" ADD CONSTRAINT "WarLog_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;
