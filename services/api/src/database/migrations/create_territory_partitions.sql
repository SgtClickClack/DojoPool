-- PostgreSQL partitioning strategy for high-volume Territory table
-- This creates hash partitions based on venue IDs for geographic distribution

-- Create the main partitioned table
CREATE TABLE IF NOT EXISTS "Territory_partitioned" (
  id TEXT PRIMARY KEY,
  venueId TEXT NOT NULL,
  name TEXT DEFAULT '',
  ownerId TEXT,
  clanId TEXT,
  level INTEGER DEFAULT 1,
  defenseScore INTEGER DEFAULT 0,
  status "TerritoryStatus" DEFAULT 'UNCLAIMED',
  resources JSONB,
  strategicValue INTEGER DEFAULT 0,
  resourceRate JSONB,
  lastTickAt TIMESTAMP(3),
  lastOwnershipChange TIMESTAMP(3),
  contestDeadline TIMESTAMP(3),
  contestedById TEXT,
  events JSONB,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL
) PARTITION BY HASH (venueId);

-- Create 16 partitions (matching our geographic shard count)
CREATE TABLE IF NOT EXISTS "Territory_p0" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE IF NOT EXISTS "Territory_p1" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 1);
CREATE TABLE IF NOT EXISTS "Territory_p2" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 2);
CREATE TABLE IF NOT EXISTS "Territory_p3" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 3);
CREATE TABLE IF NOT EXISTS "Territory_p4" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 4);
CREATE TABLE IF NOT EXISTS "Territory_p5" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 5);
CREATE TABLE IF NOT EXISTS "Territory_p6" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 6);
CREATE TABLE IF NOT EXISTS "Territory_p7" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 7);
CREATE TABLE IF NOT EXISTS "Territory_p8" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 8);
CREATE TABLE IF NOT EXISTS "Territory_p9" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 9);
CREATE TABLE IF NOT EXISTS "Territory_p10" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 10);
CREATE TABLE IF NOT EXISTS "Territory_p11" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 11);
CREATE TABLE IF NOT EXISTS "Territory_p12" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 12);
CREATE TABLE IF NOT EXISTS "Territory_p13" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 13);
CREATE TABLE IF NOT EXISTS "Territory_p14" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 14);
CREATE TABLE IF NOT EXISTS "Territory_p15" PARTITION OF "Territory_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 15);

-- Create indexes on partitioned tables for optimal performance
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_venue_status" ON "Territory_partitioned" (venueId, status);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_venue_owner" ON "Territory_partitioned" (venueId, ownerId);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_owner_status" ON "Territory_partitioned" (ownerId, status);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_clan_status" ON "Territory_partitioned" (clanId, status);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_status_value" ON "Territory_partitioned" (status, strategicValue);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_status_change" ON "Territory_partitioned" (status, lastOwnershipChange);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_contested" ON "Territory_partitioned" (contestedById, status);
CREATE INDEX IF NOT EXISTS "idx_territory_partitioned_deadline" ON "Territory_partitioned" (contestDeadline);

-- Add foreign key constraints to partitioned table
ALTER TABLE "Territory_partitioned" ADD CONSTRAINT "fk_territory_venue" FOREIGN KEY ("venueId") REFERENCES "Venue"(id) ON DELETE CASCADE;
ALTER TABLE "Territory_partitioned" ADD CONSTRAINT "fk_territory_owner" FOREIGN KEY ("ownerId") REFERENCES "User"(id);
ALTER TABLE "Territory_partitioned" ADD CONSTRAINT "fk_territory_clan" FOREIGN KEY ("clanId") REFERENCES "Clan"(id);
ALTER TABLE "Territory_partitioned" ADD CONSTRAINT "fk_territory_contested_by" FOREIGN KEY ("contestedById") REFERENCES "User"(id);

-- Create TerritoryEvent partitioned table to match
CREATE TABLE IF NOT EXISTS "TerritoryEvent_partitioned" (
  id TEXT PRIMARY KEY,
  territoryId TEXT NOT NULL,
  type "TerritoryEventType" NOT NULL,
  metadata TEXT NOT NULL,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY HASH (territoryId);

-- Create partitions for TerritoryEvent
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p0" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p1" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 1);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p2" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 2);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p3" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 3);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p4" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 4);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p5" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 5);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p6" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 6);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p7" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 7);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p8" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 8);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p9" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 9);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p10" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 10);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p11" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 11);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p12" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 12);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p13" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 13);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p14" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 14);
CREATE TABLE IF NOT EXISTS "TerritoryEvent_p15" PARTITION OF "TerritoryEvent_partitioned" FOR VALUES WITH (MODULUS 16, REMAINDER 15);

-- Indexes for TerritoryEvent partitioned table
CREATE INDEX IF NOT EXISTS "idx_territory_event_partitioned_territory" ON "TerritoryEvent_partitioned" (territoryId);
CREATE INDEX IF NOT EXISTS "idx_territory_event_partitioned_created" ON "TerritoryEvent_partitioned" (createdAt);

-- Foreign key constraint for TerritoryEvent
ALTER TABLE "TerritoryEvent_partitioned" ADD CONSTRAINT "fk_territory_event_territory" FOREIGN KEY ("territoryId") REFERENCES "Territory_partitioned"(id) ON DELETE CASCADE;

-- Migration script to move data from old tables to partitioned tables
-- This should be run after creating the partitioned structure
INSERT INTO "Territory_partitioned"
SELECT * FROM "Territory"
WHERE "Territory".id IS NOT NULL;

INSERT INTO "TerritoryEvent_partitioned"
SELECT * FROM "TerritoryEvent"
WHERE "TerritoryEvent".id IS NOT NULL;

-- Optional: Drop old tables after verifying data migration
-- DROP TABLE "Territory";
-- DROP TABLE "TerritoryEvent";
-- ALTER TABLE "Territory_partitioned" RENAME TO "Territory";
-- ALTER TABLE "TerritoryEvent_partitioned" RENAME TO "TerritoryEvent";
