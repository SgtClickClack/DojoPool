-- Database Indexing Optimization for DojoPool
-- These indexes are designed to improve query performance based on common access patterns

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON "User" (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username ON "User" (username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role ON "User" (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_is_banned ON "User" ("isBanned");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON "User" ("createdAt");

-- Composite index for user search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search ON "User" (username, email) WHERE "isBanned" = false;

-- Venue table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_status ON "Venue" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_owner ON "Venue" ("ownerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_location ON "Venue" (lat, lng);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_created_at ON "Venue" ("createdAt");

-- Composite index for venue search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_search ON "Venue" (name, status) WHERE status = 'ACTIVE';

-- Match table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_player_a ON "Match" ("playerAId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_player_b ON "Match" ("playerBId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_venue ON "Match" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_status ON "Match" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_winner ON "Match" ("winnerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_created_at ON "Match" ("createdAt");

-- Composite indexes for match queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_player_status ON "Match" ("playerAId", status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_player_b_status ON "Match" ("playerBId", status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_venue_status ON "Match" ("venueId", status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_date_status ON "Match" ("createdAt", status);

-- Tournament table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_status ON "Tournament" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_type ON "Tournament" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_venue ON "Tournament" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_start_date ON "Tournament" ("startDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_end_date ON "Tournament" ("endDate");

-- Composite index for tournament queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_status_date ON "Tournament" (status, "startDate");

-- TournamentParticipant table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participant_user ON "TournamentParticipant" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participant_tournament ON "TournamentParticipant" ("tournamentId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participant_rank ON "TournamentParticipant" ("finalRank");

-- Clan table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_name ON "Clan" (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_leader ON "Clan" ("leaderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_status ON "Clan" (status);

-- ClanMember table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_member_user ON "ClanMember" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_member_clan ON "ClanMember" ("clanId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_member_role ON "ClanMember" (role);

-- ActivityEvent table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_event_user ON "ActivityEvent" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_event_venue ON "ActivityEvent" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_event_clan ON "ActivityEvent" ("clanId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_event_type ON "ActivityEvent" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_event_created_at ON "ActivityEvent" ("createdAt");

-- Composite index for activity feed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_feed ON "ActivityEvent" ("userId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_venue_feed ON "ActivityEvent" ("venueId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_clan_feed ON "ActivityEvent" ("clanId", "createdAt");

-- Territory table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territory_owner ON "Territory" ("ownerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territory_status ON "Territory" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territory_location ON "Territory" (lat, lng);

-- Challenge table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_challenger ON "Challenge" ("challengerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_defender ON "Challenge" ("defenderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_status ON "Challenge" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_created_at ON "Challenge" ("createdAt");

-- Notification table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user ON "Notification" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_read ON "Notification" ("isRead");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_type ON "Notification" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_created_at ON "Notification" ("createdAt");

-- Composite index for user notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user_read ON "Notification" ("userId", "isRead", "createdAt");

-- Transaction table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_user ON "Transaction" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_type ON "Transaction" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_status ON "Transaction" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_created_at ON "Transaction" ("createdAt");

-- Wallet table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_user ON "Wallet" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_type ON "Wallet" (type);

-- Content table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_author ON "Content" ("authorId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_type ON "Content" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status ON "Content" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_created_at ON "Content" ("createdAt");

-- ContentLike table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_like_user ON "ContentLike" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_like_content ON "ContentLike" ("contentId");

-- Feedback table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_user ON "Feedback" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_status ON "Feedback" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_type ON "Feedback" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_created_at ON "Feedback" ("createdAt");

-- GameSession table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_user ON "GameSession" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_venue ON "GameSession" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_status ON "GameSession" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_created_at ON "GameSession" ("createdAt");

-- ShadowRun table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shadow_run_user ON "ShadowRun" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shadow_run_status ON "ShadowRun" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shadow_run_created_at ON "ShadowRun" ("createdAt");

-- DojoCheckIn table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dojo_checkin_user ON "DojoCheckIn" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dojo_checkin_venue ON "DojoCheckIn" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dojo_checkin_date ON "DojoCheckIn" ("checkInDate");

-- UserInventoryItem table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_inventory_user ON "UserInventoryItem" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_inventory_item ON "UserInventoryItem" ("itemId");

-- RefreshToken table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_user ON "RefreshToken" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_token ON "RefreshToken" (token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_token_expires ON "RefreshToken" ("expiresAt");

-- AuditLog table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user ON "AuditLog" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action ON "AuditLog" (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_created_at ON "AuditLog" ("createdAt");

-- DirectMessage table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_message_sender ON "DirectMessage" ("senderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_message_receiver ON "DirectMessage" ("receiverId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_message_created_at ON "DirectMessage" ("createdAt");

-- Friendship table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_requester ON "Friendship" ("requesterId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_addressee ON "Friendship" ("addresseeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_status ON "Friendship" (status);

-- UserNFT table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nft_user ON "UserNFT" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nft_nft ON "UserNFT" ("nftId");

-- UserAchievement table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_user ON "UserAchievement" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_achievement ON "UserAchievement" ("achievementId");

-- CheckIn table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkin_user ON "CheckIn" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkin_venue ON "CheckIn" ("venueId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkin_date ON "CheckIn" ("checkInDate");

-- Performance monitoring queries
-- These can be used to monitor index usage and performance

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Check for unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_tup_read = 0
  AND idx_tup_fetch = 0;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
