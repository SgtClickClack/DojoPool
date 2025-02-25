import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const analysisAction = req.query.analysis?.[0];

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (analysisAction) {
      case 'player-stats':
        if (method === 'GET') {
          return handleGetPlayerStats(req, res, user.userId);
        }
        break;

      case 'game-history':
        if (method === 'GET') {
          return handleGetGameHistory(req, res, user.userId);
        }
        break;

      case 'shot-analysis':
        if (method === 'GET') {
          return handleGetShotAnalysis(req, res, user.userId);
        }
        break;

      case 'performance-trends':
        if (method === 'GET') {
          return handleGetPerformanceTrends(req, res, user.userId);
        }
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Game Analysis API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetPlayerStats(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const result = await pool.query(
    `SELECT 
       ps.*,
       u.username,
       ROUND(CAST(ps.games_won AS FLOAT) / NULLIF(ps.games_played, 0) * 100, 2) as win_rate,
       (
         SELECT ROUND(AVG(shot_accuracy), 2)
         FROM game_analytics
         WHERE player_id = ps.user_id
       ) as avg_shot_accuracy,
       (
         SELECT ROUND(AVG(position_control), 2)
         FROM game_analytics
         WHERE player_id = ps.user_id
       ) as avg_position_control,
       (
         SELECT ROUND(AVG(safety_play_success), 2)
         FROM game_analytics
         WHERE player_id = ps.user_id
       ) as avg_safety_success,
       (
         SELECT ROUND(AVG(break_success), 2)
         FROM game_analytics
         WHERE player_id = ps.user_id
       ) as avg_break_success
     FROM player_stats ps
     JOIN users u ON ps.user_id = u.id
     WHERE ps.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Player stats not found' });
  }

  res.status(200).json(result.rows[0]);
}

async function handleGetGameHistory(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { limit = 10, offset = 0 } = req.query;

  const result = await pool.query(
    `SELECT 
       g.*,
       p1.username as player1_username,
       p2.username as player2_username,
       v.name as venue_name,
       t.table_number,
       (
         SELECT json_build_object(
           'shot_accuracy', ROUND(AVG(shot_accuracy), 2),
           'position_control', ROUND(AVG(position_control), 2),
           'safety_play_success', ROUND(AVG(safety_play_success), 2),
           'break_success', ROUND(AVG(break_success), 2)
         )
         FROM game_analytics
         WHERE game_id = g.id AND player_id = $1
       ) as player_performance
     FROM games g
     JOIN users p1 ON g.player1_id = p1.id
     JOIN users p2 ON g.player2_id = p2.id
     JOIN pool_tables t ON g.table_id = t.id
     JOIN venues v ON t.venue_id = v.id
     WHERE g.player1_id = $1 OR g.player2_id = $1
     ORDER BY g.start_time DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.status(200).json({
    games: result.rows,
    count: result.rowCount
  });
}

async function handleGetShotAnalysis(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gameId } = req.query;

  let query = `
    SELECT 
      ga.*,
      g.game_type,
      CASE 
        WHEN g.player1_id = ga.player_id THEN g.score_player1
        ELSE g.score_player2
      END as player_score,
      CASE 
        WHEN g.player1_id = ga.player_id THEN g.score_player2
        ELSE g.score_player1
      END as opponent_score
    FROM game_analytics ga
    JOIN games g ON ga.game_id = g.id
    WHERE ga.player_id = $1
  `;

  const queryParams: any[] = [userId];

  if (gameId) {
    query += ' AND ga.game_id = $2';
    queryParams.push(gameId);
  }

  query += ' ORDER BY ga.created_at DESC';

  const result = await pool.query(query, queryParams);

  // Calculate shot type distribution
  const shotAnalysis = {
    accuracy: {
      total: 0,
      count: 0,
      distribution: {
        excellent: 0, // 90-100%
        good: 0,     // 70-89%
        average: 0,  // 50-69%
        poor: 0      // 0-49%
      }
    },
    position: {
      total: 0,
      count: 0,
      distribution: {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0
      }
    },
    safety: {
      total: 0,
      count: 0,
      success_rate: 0
    }
  };

  result.rows.forEach(shot => {
    // Accuracy analysis
    if (shot.shot_accuracy !== null) {
      shotAnalysis.accuracy.total += shot.shot_accuracy;
      shotAnalysis.accuracy.count++;
      
      if (shot.shot_accuracy >= 90) shotAnalysis.accuracy.distribution.excellent++;
      else if (shot.shot_accuracy >= 70) shotAnalysis.accuracy.distribution.good++;
      else if (shot.shot_accuracy >= 50) shotAnalysis.accuracy.distribution.average++;
      else shotAnalysis.accuracy.distribution.poor++;
    }

    // Position control analysis
    if (shot.position_control !== null) {
      shotAnalysis.position.total += shot.position_control;
      shotAnalysis.position.count++;
      
      if (shot.position_control >= 90) shotAnalysis.position.distribution.excellent++;
      else if (shot.position_control >= 70) shotAnalysis.position.distribution.good++;
      else if (shot.position_control >= 50) shotAnalysis.position.distribution.average++;
      else shotAnalysis.position.distribution.poor++;
    }

    // Safety play analysis
    if (shot.safety_play_success !== null) {
      shotAnalysis.safety.total += shot.safety_play_success;
      shotAnalysis.safety.count++;
    }
  });

  // Calculate averages
  shotAnalysis.accuracy.average = shotAnalysis.accuracy.count > 0 
    ? Math.round(shotAnalysis.accuracy.total / shotAnalysis.accuracy.count * 100) / 100
    : 0;

  shotAnalysis.position.average = shotAnalysis.position.count > 0
    ? Math.round(shotAnalysis.position.total / shotAnalysis.position.count * 100) / 100
    : 0;

  shotAnalysis.safety.success_rate = shotAnalysis.safety.count > 0
    ? Math.round(shotAnalysis.safety.total / shotAnalysis.safety.count * 100) / 100
    : 0;

  res.status(200).json({
    shots: result.rows,
    analysis: shotAnalysis
  });
}

async function handleGetPerformanceTrends(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { timeframe = '30d' } = req.query;

  let intervalQuery = '';
  switch (timeframe) {
    case '7d':
      intervalQuery = "interval '7 days'";
      break;
    case '30d':
      intervalQuery = "interval '30 days'";
      break;
    case '90d':
      intervalQuery = "interval '90 days'";
      break;
    case '365d':
      intervalQuery = "interval '365 days'";
      break;
    default:
      intervalQuery = "interval '30 days'";
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get overall performance trends
    const overallTrends = await client.query(
      `WITH daily_stats AS (
         SELECT 
           DATE_TRUNC('day', g.start_time) as date,
           COUNT(*) as games_played,
           COUNT(CASE WHEN g.winner_id = $1 THEN 1 END) as games_won,
           AVG(CASE WHEN g.player1_id = $1 THEN g.score_player1 ELSE g.score_player2 END) as avg_score
         FROM games g
         WHERE (g.player1_id = $1 OR g.player2_id = $1)
           AND g.start_time >= CURRENT_DATE - $2::interval
         GROUP BY DATE_TRUNC('day', g.start_time)
       )
       SELECT 
         date,
         games_played,
         games_won,
         ROUND(CAST(games_won AS FLOAT) / games_played * 100, 2) as win_rate,
         ROUND(avg_score::numeric, 2) as avg_score
       FROM daily_stats
       ORDER BY date`,
      [userId, intervalQuery]
    );

    // Get shot performance trends
    const shotTrends = await client.query(
      `WITH daily_stats AS (
         SELECT 
           DATE_TRUNC('day', ga.created_at) as date,
           AVG(ga.shot_accuracy) as avg_accuracy,
           AVG(ga.position_control) as avg_position,
           AVG(ga.safety_play_success) as avg_safety,
           AVG(ga.break_success) as avg_break
         FROM game_analytics ga
         WHERE ga.player_id = $1
           AND ga.created_at >= CURRENT_DATE - $2::interval
         GROUP BY DATE_TRUNC('day', ga.created_at)
       )
       SELECT 
         date,
         ROUND(avg_accuracy::numeric, 2) as avg_accuracy,
         ROUND(avg_position::numeric, 2) as avg_position,
         ROUND(avg_safety::numeric, 2) as avg_safety,
         ROUND(avg_break::numeric, 2) as avg_break
       FROM daily_stats
       ORDER BY date`,
      [userId, intervalQuery]
    );

    // Get game type performance
    const gameTypePerformance = await client.query(
      `SELECT 
         g.game_type,
         COUNT(*) as games_played,
         COUNT(CASE WHEN g.winner_id = $1 THEN 1 END) as games_won,
         ROUND(AVG(CASE WHEN g.player1_id = $1 THEN g.score_player1 ELSE g.score_player2 END)::numeric, 2) as avg_score,
         ROUND(CAST(COUNT(CASE WHEN g.winner_id = $1 THEN 1 END) AS FLOAT) / COUNT(*) * 100, 2) as win_rate
       FROM games g
       WHERE (g.player1_id = $1 OR g.player2_id = $1)
         AND g.start_time >= CURRENT_DATE - $2::interval
       GROUP BY g.game_type`,
      [userId, intervalQuery]
    );

    await client.query('COMMIT');

    res.status(200).json({
      overall_trends: overallTrends.rows,
      shot_trends: shotTrends.rows,
      game_type_performance: gameTypePerformance.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} 