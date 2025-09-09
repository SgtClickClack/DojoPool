-- Migration: Add Player Report category and attachments to Feedback
-- Created: 2025-01-30
-- Description: Adds PLAYER_REPORT category and attachments field to Feedback model

-- Add PLAYER_REPORT to FeedbackCategory enum
-- Note: SQLite doesn't support ALTER TYPE, so we need to recreate the table

-- Create new table with updated schema
CREATE TABLE "feedback_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "adminNotes" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy existing data from old table
INSERT INTO "feedback_new" (
    "id", "userId", "message", "category", "status", "priority",
    "adminNotes", "attachments", "createdAt", "updatedAt", "resolvedAt", "resolvedBy"
)
SELECT
    "id", "userId", "message", "category", "status", "priority",
    "adminNotes", '[]', "createdAt", "updatedAt", "resolvedAt", "resolvedBy"
FROM "feedback";

-- Drop old table
DROP TABLE "feedback";

-- Rename new table
ALTER TABLE "feedback_new" RENAME TO "feedback";

-- Create indexes
CREATE INDEX "feedback_userId_idx" ON "feedback"("userId");
CREATE INDEX "feedback_category_idx" ON "feedback"("category");
CREATE INDEX "feedback_status_idx" ON "feedback"("status");
CREATE INDEX "feedback_priority_idx" ON "feedback"("priority");
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");
CREATE INDEX "feedback_resolvedBy_idx" ON "feedback"("resolvedBy");
