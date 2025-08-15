-- Performance indexes for common queries

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin(email gin_trgm_ops);

-- Venues indexes
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm ON venues USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues(created_at);

-- Tables indexes
CREATE INDEX IF NOT EXISTS idx_tables_venue_active ON tables(venue_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tables_number_venue ON tables(table_number, venue_id);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_players ON games(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner_id);
CREATE INDEX IF NOT EXISTS idx_games_table_status ON games(table_id, status);
CREATE INDEX IF NOT EXISTS idx_games_player1_start ON games(player1_id, start_time);
CREATE INDEX IF NOT EXISTS idx_games_player2_start ON games(player2_id, start_time);

-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_venue_status ON tournaments(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING gin(name gin_trgm_ops);

-- Tournament players indexes
CREATE INDEX IF NOT EXISTS idx_tournament_players_status ON tournament_players(status);
CREATE INDEX IF NOT EXISTS idx_tournament_players_registration ON tournament_players(registration_time);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_venues ON venues(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_tables ON tables(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_users ON users(id) WHERE is_active = true;

-- Composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_games_venue_date ON games(table_id, start_time);
CREATE INDEX IF NOT EXISTS idx_tournament_venue_date ON tournaments(venue_id, start_date);

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE venues;
ANALYZE tables;
ANALYZE games;
ANALYZE tournaments;
ANALYZE tournament_players; 