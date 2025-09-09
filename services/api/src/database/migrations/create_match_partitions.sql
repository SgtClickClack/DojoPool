-- PostgreSQL partitioning strategy for high-volume Match table
-- This creates hash partitions based on player IDs for even distribution

-- Create the main partitioned table
CREATE TABLE IF NOT EXISTS "Match_partitioned" (
  id TEXT PRIMARY KEY,
  tournamentId TEXT,
  venueId TEXT,
  tableId TEXT,
  playerAId TEXT NOT NULL,
  playerBId TEXT NOT NULL,
  winnerId TEXT,
  loserId TEXT,
  status "MatchStatus" DEFAULT 'SCHEDULED',
  scoreA INTEGER DEFAULT 0,
  scoreB INTEGER DEFAULT 0,
  isRanked BOOLEAN DEFAULT false,
  eloChangeA INTEGER DEFAULT 0,
  eloChangeB INTEGER DEFAULT 0,
  bracketRound INTEGER,
  bracketMatch INTEGER,
  events JSONB,
  activityEvents JSONB,
  round INTEGER,
  wager INTEGER DEFAULT 0,
  aiAnalysisJson TEXT,
  startedAt TIMESTAMP(3),
  endedAt TIMESTAMP(3),
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL
) PARTITION BY HASH (playerAId);

-- Create 32 partitions (matching our shard count)
CREATE TABLE IF NOT EXISTS "Match_p0" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 0);
CREATE TABLE IF NOT EXISTS "Match_p1" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 1);
CREATE TABLE IF NOT EXISTS "Match_p2" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 2);
CREATE TABLE IF NOT EXISTS "Match_p3" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 3);
CREATE TABLE IF NOT EXISTS "Match_p4" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 4);
CREATE TABLE IF NOT EXISTS "Match_p5" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 5);
CREATE TABLE IF NOT EXISTS "Match_p6" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 6);
CREATE TABLE IF NOT EXISTS "Match_p7" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 7);
CREATE TABLE IF NOT EXISTS "Match_p8" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 8);
CREATE TABLE IF NOT EXISTS "Match_p9" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 9);
CREATE TABLE IF NOT EXISTS "Match_p10" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 10);
CREATE TABLE IF NOT EXISTS "Match_p11" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 11);
CREATE TABLE IF NOT EXISTS "Match_p12" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 12);
CREATE TABLE IF NOT EXISTS "Match_p13" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 13);
CREATE TABLE IF NOT EXISTS "Match_p14" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 14);
CREATE TABLE IF NOT EXISTS "Match_p15" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 15);
CREATE TABLE IF NOT EXISTS "Match_p16" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 16);
CREATE TABLE IF NOT EXISTS "Match_p17" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 17);
CREATE TABLE IF NOT EXISTS "Match_p18" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 18);
CREATE TABLE IF NOT EXISTS "Match_p19" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 19);
CREATE TABLE IF NOT EXISTS "Match_p20" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 20);
CREATE TABLE IF NOT EXISTS "Match_p21" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 21);
CREATE TABLE IF NOT EXISTS "Match_p22" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 22);
CREATE TABLE IF NOT EXISTS "Match_p23" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 23);
CREATE TABLE IF NOT EXISTS "Match_p24" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 24);
CREATE TABLE IF NOT EXISTS "Match_p25" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 25);
CREATE TABLE IF NOT EXISTS "Match_p26" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 26);
CREATE TABLE IF NOT EXISTS "Match_p27" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 27);
CREATE TABLE IF NOT EXISTS "Match_p28" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 28);
CREATE TABLE IF NOT EXISTS "Match_p29" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 29);
CREATE TABLE IF NOT EXISTS "Match_p30" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 30);
CREATE TABLE IF NOT EXISTS "Match_p31" PARTITION OF "Match_partitioned" FOR VALUES WITH (MODULUS 32, REMAINDER 31);

-- Create indexes on partitioned tables for optimal performance
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_status_created" ON "Match_partitioned" (status, "createdAt");
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_tournament_status" ON "Match_partitioned" (tournamentId, status, bracketRound);
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_playerA_status" ON "Match_partitioned" (playerAId, status);
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_playerB_status" ON "Match_partitioned" (playerBId, status);
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_venue_status" ON "Match_partitioned" (venueId, status);
CREATE INDEX IF NOT EXISTS "idx_match_partitioned_ranked_status" ON "Match_partitioned" (isRanked, status, "createdAt");

-- Add foreign key constraints to partitioned table
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_tournament" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"(id) ON DELETE SET NULL;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_venue" FOREIGN KEY ("venueId") REFERENCES "Venue"(id) ON DELETE SET NULL;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_table" FOREIGN KEY ("tableId") REFERENCES "Table"(id) ON DELETE SET NULL;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_playerA" FOREIGN KEY ("playerAId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_playerB" FOREIGN KEY ("playerBId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_winner" FOREIGN KEY ("winnerId") REFERENCES "User"(id) ON DELETE SET NULL;
ALTER TABLE "Match_partitioned" ADD CONSTRAINT "fk_match_loser" FOREIGN KEY ("loserId") REFERENCES "User"(id) ON DELETE SET NULL;

-- Migration script to move data from old table to partitioned table
-- This should be run after creating the partitioned structure
INSERT INTO "Match_partitioned"
SELECT * FROM "Match"
WHERE "Match".id IS NOT NULL;

-- Optional: Drop old table after verifying data migration
-- DROP TABLE "Match";
-- ALTER TABLE "Match_partitioned" RENAME TO "Match";
