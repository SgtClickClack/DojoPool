import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { validateGameType } from '../../../lib/validation';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const gameAction = req.query.game?.[0];

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (gameAction) {
      case 'create':
        if (method === 'POST') {
          return handleCreateGame(req, res, user.userId);
        }
        break;

      case 'join':
        if (method === 'POST') {
          return handleJoinGame(req, res, user.userId);
        }
        break;

      case 'state':
        if (method === 'GET') {
          return handleGetGameState(req, res, user.userId);
        }
        if (method === 'PUT') {
          return handleUpdateGameState(req, res, user.userId);
        }
        break;

      case 'shot':
        if (method === 'POST') {
          return handleRecordShot(req, res, user.userId);
        }
        break;

      case 'list':
        if (method === 'GET') {
          return handleListGames(req, res, user.userId);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Game API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateGame(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tableId, gameType } = req.body;

  if (!tableId || !gameType) {
    return res.status(400).json({ error: 'Table ID and game type are required' });
  }

  if (!validateGameType(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if table is available
    const tableResult = await client.query(
      'SELECT id, status FROM pool_tables WHERE id = $1',
      [tableId]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (tableResult.rows[0].status !== 'available') {
      return res.status(400).json({ error: 'Table is not available' });
    }

    // Create new game
    const gameResult = await client.query(
      `INSERT INTO games (table_id, player1_id, game_type, status)
       VALUES ($1, $2, $3, 'waiting_for_player')
       RETURNING id`,
      [tableId, userId, gameType]
    );

    // Update table status
    await client.query(
      'UPDATE pool_tables SET status = $1 WHERE id = $2',
      ['in_use', tableId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      gameId: gameResult.rows[0].id,
      message: 'Game created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleJoinGame(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if game exists and is waiting for player
    const gameResult = await client.query(
      `SELECT id, player1_id, status 
       FROM games 
       WHERE id = $1 AND status = 'waiting_for_player'`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or not available' });
    }

    if (gameResult.rows[0].player1_id === userId) {
      return res.status(400).json({ error: 'Cannot join your own game' });
    }

    // Join game
    await client.query(
      `UPDATE games 
       SET player2_id = $1, status = 'in_progress', start_time = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, gameId]
    );

    await client.query('COMMIT');

    res.status(200).json({ message: 'Successfully joined game' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleGetGameState(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const result = await pool.query(
    `SELECT g.*, 
            p1.username as player1_username,
            p2.username as player2_username,
            t.table_number
     FROM games g
     JOIN users p1 ON g.player1_id = p1.id
     LEFT JOIN users p2 ON g.player2_id = p2.id
     JOIN pool_tables t ON g.table_id = t.id
     WHERE g.id = $1 AND (g.player1_id = $2 OR g.player2_id = $2)`,
    [gameId, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Game not found or access denied' });
  }

  res.status(200).json(result.rows[0]);
}

async function handleUpdateGameState(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gameId } = req.query;
  const { status, score1, score2, winnerId } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify user is part of the game
    const gameResult = await client.query(
      'SELECT id, player1_id, player2_id FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];
    if (game.player1_id !== userId && game.player2_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this game' });
    }

    // Update game state
    await client.query(
      `UPDATE games 
       SET status = $1, score_player1 = $2, score_player2 = $3,
           winner_id = $4, end_time = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE end_time END
       WHERE id = $5`,
      [status, score1, score2, winnerId, gameId]
    );

    // If game is completed, update player stats and table status
    if (status === 'completed') {
      // Update player stats
      await client.query(
        `UPDATE player_stats 
         SET games_played = games_played + 1,
             games_won = CASE WHEN user_id = $1 THEN games_won + 1 ELSE games_won END
         WHERE user_id IN ($2, $3)`,
        [winnerId, game.player1_id, game.player2_id]
      );

      // Update table status
      await client.query(
        `UPDATE pool_tables 
         SET status = 'available' 
         WHERE id = (SELECT table_id FROM games WHERE id = $1)`,
        [gameId]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({ message: 'Game state updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleRecordShot(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { gameId } = req.query;
  const { accuracy, position, safety } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  // Verify user is part of the game
  const gameResult = await pool.query(
    'SELECT id FROM games WHERE id = $1 AND (player1_id = $2 OR player2_id = $2)',
    [gameId, userId]
  );

  if (gameResult.rows.length === 0) {
    return res.status(404).json({ error: 'Game not found or access denied' });
  }

  // Record shot analytics
  await pool.query(
    `INSERT INTO game_analytics 
     (game_id, player_id, shot_accuracy, position_control, safety_play_success)
     VALUES ($1, $2, $3, $4, $5)`,
    [gameId, userId, accuracy, position, safety]
  );

  res.status(200).json({ message: 'Shot recorded successfully' });
}

async function handleListGames(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { status, limit = 10, offset = 0 } = req.query;

  let query = `
    SELECT g.*, 
           p1.username as player1_username,
           p2.username as player2_username,
           t.table_number,
           v.name as venue_name
    FROM games g
    JOIN users p1 ON g.player1_id = p1.id
    LEFT JOIN users p2 ON g.player2_id = p2.id
    JOIN pool_tables t ON g.table_id = t.id
    JOIN venues v ON t.venue_id = v.id
    WHERE (g.player1_id = $1 OR g.player2_id = $1)
  `;

  const queryParams = [userId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND g.status = $${paramCount}`;
    queryParams.push(status);
  }

  query += ` ORDER BY g.start_time DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  res.status(200).json({
    games: result.rows,
    count: result.rowCount
  });
} 