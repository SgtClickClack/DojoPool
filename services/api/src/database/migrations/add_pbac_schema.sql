-- Migration: Add Policy-Based Access Control (PBAC) Schema
-- This migration adds the complete PBAC schema to support progressive enhancement of RBAC

-- Create Policy table
CREATE TABLE IF NOT EXISTS "Policy" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  effect "PolicyEffect" NOT NULL,
  conditions JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  isEnabled BOOLEAN DEFAULT true,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create PolicyEffect enum
DO $$ BEGIN
  CREATE TYPE "PolicyEffect" AS ENUM('ALLOW', 'DENY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create AssignmentType enum
DO $$ BEGIN
  CREATE TYPE "AssignmentType" AS ENUM('USER', 'ROLE', 'GROUP', 'ATTRIBUTE_BASED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create PolicyDecision enum
DO $$ BEGIN
  CREATE TYPE "PolicyDecision" AS ENUM('DENY', 'ALLOW', 'NOT_APPLICABLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create PolicyAssignment table
CREATE TABLE IF NOT EXISTS "PolicyAssignment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  policyId TEXT NOT NULL,
  userId TEXT,
  roleId TEXT,
  groupId TEXT,
  assignmentType "AssignmentType" NOT NULL,
  conditions JSONB,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PolicyAssignment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create PolicyEvaluation table for auditing
CREATE TABLE IF NOT EXISTS "PolicyEvaluation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  policyId TEXT NOT NULL,
  userId TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  decision "PolicyDecision" NOT NULL,
  reason TEXT,
  context JSONB NOT NULL,
  evaluatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PolicyEvaluation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create UserGroup table for advanced grouping
CREATE TABLE IF NOT EXISTS "UserGroup" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create UserGroupMember table
CREATE TABLE IF NOT EXISTS "UserGroupMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  groupId TEXT NOT NULL,
  userId TEXT NOT NULL,
  joinedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add PBAC attributes to existing User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS attributes JSONB,
ADD COLUMN IF NOT EXISTS groups TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Policy_priority_isEnabled_idx" ON "Policy"(priority, isEnabled);
CREATE INDEX IF NOT EXISTS "PolicyAssignment_policyId_idx" ON "PolicyAssignment"(policyId);
CREATE INDEX IF NOT EXISTS "PolicyAssignment_userId_idx" ON "PolicyAssignment"(userId);
CREATE INDEX IF NOT EXISTS "PolicyAssignment_roleId_idx" ON "PolicyAssignment"(roleId);
CREATE INDEX IF NOT EXISTS "PolicyAssignment_groupId_idx" ON "PolicyAssignment"(groupId);
CREATE INDEX IF NOT EXISTS "PolicyEvaluation_userId_resource_action_idx" ON "PolicyEvaluation"(userId, resource, action);
CREATE INDEX IF NOT EXISTS "PolicyEvaluation_evaluatedAt_idx" ON "PolicyEvaluation"(evaluatedAt);
CREATE INDEX IF NOT EXISTS "UserGroupMember_groupId_userId_key" ON "UserGroupMember"(groupId, userId);
CREATE INDEX IF NOT EXISTS "PolicyAssignment_unique_assignment" ON "PolicyAssignment"(policyId, userId, roleId, groupId, assignmentType);

-- Add unique constraint for policy assignments
ALTER TABLE "PolicyAssignment"
ADD CONSTRAINT IF NOT EXISTS "PolicyAssignment_unique" UNIQUE (policyId, userId, roleId, groupId, assignmentType);

-- Add unique constraint for user group memberships
ALTER TABLE "UserGroupMember"
ADD CONSTRAINT IF NOT EXISTS "UserGroupMember_unique" UNIQUE (groupId, userId);
