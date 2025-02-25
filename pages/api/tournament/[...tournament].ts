import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { validateTournamentName, validatePlayerCount } from '../../../lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const tournamentAction = req.query.tournament?.[0];

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (tournamentAction) {
      case 'create':
        if (method === 'POST') {
          return handleCreateTournament(req, res, user.userId);
        }
        break;

      case 'join':
        if (method === 'POST') {
          return handleJoinTournament(req, res, user.userId);
        }
        break;

      case 'start':
        if (method === 'POST') {
          return handleStartTournament(req, res, user.userId);
        }
        break;

      case 'matches':
        if (method === 'GET') {
          return handleGetMatches(req, res, user.userId);
        }
        if (method === 'PUT') {
          return handleUpdateMatch(req, res, user.userId);
        }
        break;

      case 'list':
        if (method === 'GET') {
          return handleListTournaments(req, res);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Tournament API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateTournament(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { name, venueId, startDate, maxPlayers, prizePool } = req.body;

  if (!name || !venueId || !startDate || !maxPlayers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validateTournamentName(name)) {
    return res.status(400).json({ error: 'Invalid tournament name' });
  }

  if (!validatePlayerCount(maxPlayers)) {
    return res.status(400).json({ error: 'Player count must be a power of 2 between 4 and 128' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tournament
    const tournamentResult = await client.query(
      `INSERT INTO tournaments 
       (name, venue_id, start_date, max_players, prize_pool, status)
       VALUES ($1, $2, $3, $4, $5, 'registration_open')
       RETURNING id`,
      [name, venueId, startDate, maxPlayers, prizePool]
    );

    // Add creator as first participant
    await client.query(
      `INSERT INTO tournament_participants 
       (tournament_id, player_id, seed_number)
       VALUES ($1, $2, 1)`,
      [tournamentResult.rows[0].id, userId]
    );

    await client.query(
      `UPDATE tournaments 
       SET current_players = 1
       WHERE id = $1`,
      [tournamentResult.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tournamentId: tournamentResult.rows[0].id,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleJoinTournament(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tournamentId } = req.body;

  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check tournament status and capacity
    const tournamentResult = await client.query(
      `SELECT current_players, max_players, status 
       FROM tournaments 
       WHERE id = $1`,
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    if (tournament.status !== 'registration_open') {
      return res.status(400).json({ error: 'Tournament registration is closed' });
    }

    if (tournament.current_players >= tournament.max_players) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Check if player is already registered
    const participantResult = await client.query(
      'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND player_id = $2',
      [tournamentId, userId]
    );

    if (participantResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this tournament' });
    }

    // Add participant
    await client.query(
      `INSERT INTO tournament_participants 
       (tournament_id, player_id, seed_number)
       VALUES ($1, $2, $3)`,
      [tournamentId, userId, tournament.current_players + 1]
    );

    // Update participant count
    await client.query(
      `UPDATE tournaments 
       SET current_players = current_players + 1
       WHERE id = $1`,
      [tournamentId]
    );

    await client.query('COMMIT');

    res.status(200).json({ message: 'Successfully joined tournament' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleStartTournament(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tournamentId } = req.body;

  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get tournament details
    const tournamentResult = await client.query(
      `SELECT t.*, v.user_id as venue_owner
       FROM tournaments t
       JOIN venues v ON t.venue_id = v.id
       WHERE t.id = $1`,
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    // Verify user is venue owner
    if (tournament.venue_owner !== userId) {
      return res.status(403).json({ error: 'Only venue owner can start tournament' });
    }

    if (tournament.status !== 'registration_open') {
      return res.status(400).json({ error: 'Tournament cannot be started' });
    }

    // Get participants
    const participantsResult = await client.query(
      `SELECT player_id, seed_number 
       FROM tournament_participants 
       WHERE tournament_id = $1 
       ORDER BY seed_number`,
      [tournamentId]
    );

    const participants = participantsResult.rows;
    const numParticipants = participants.length;

    if (numParticipants < 4) {
      return res.status(400).json({ error: 'Not enough participants' });
    }

    // Generate first round matches
    for (let i = 0; i < numParticipants; i += 2) {
      await client.query(
        `INSERT INTO tournament_matches 
         (tournament_id, round_number, match_number, player1_id, player2_id)
         VALUES ($1, 1, $2, $3, $4)`,
        [tournamentId, Math.floor(i/2) + 1, participants[i].player_id, participants[i+1].player_id]
      );
    }

    // Update tournament status
    await client.query(
      `UPDATE tournaments 
       SET status = 'in_progress'
       WHERE id = $1`,
      [tournamentId]
    );

    await client.query('COMMIT');

    res.status(200).json({ message: 'Tournament started successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleGetMatches(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tournamentId } = req.query;

  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  const result = await pool.query(
    `SELECT m.*,
            p1.username as player1_username,
            p2.username as player2_username,
            CASE WHEN winner_id IS NOT NULL THEN
              (SELECT username FROM users WHERE id = m.winner_id)
            END as winner_username
     FROM tournament_matches m
     JOIN users p1 ON m.player1_id = p1.id
     JOIN users p2 ON m.player2_id = p2.id
     WHERE m.tournament_id = $1
     ORDER BY m.round_number, m.match_number`,
    [tournamentId]
  );

  res.status(200).json(result.rows);
}

async function handleUpdateMatch(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { matchId } = req.query;
  const { winnerId } = req.body;

  if (!matchId || !winnerId) {
    return res.status(400).json({ error: 'Match ID and winner ID are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get match details
    const matchResult = await client.query(
      `SELECT m.*, t.venue_id
       FROM tournament_matches m
       JOIN tournaments t ON m.tournament_id = t.id
       WHERE m.id = $1`,
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Verify user is venue owner
    const venueResult = await client.query(
      'SELECT user_id FROM venues WHERE id = $1',
      [match.venue_id]
    );

    if (venueResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Only venue owner can update match results' });
    }

    // Update match result
    await client.query(
      `UPDATE tournament_matches 
       SET winner_id = $1, 
           status = 'completed',
           end_time = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [winnerId, matchId]
    );

    // Check if all matches in current round are completed
    const roundResult = await client.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
       FROM tournament_matches
       WHERE tournament_id = $1 AND round_number = $2`,
      [match.tournament_id, match.round_number]
    );

    const roundStats = roundResult.rows[0];

    // If round is complete, create next round matches
    if (roundStats.total === roundStats.completed) {
      const winners = await client.query(
        `SELECT winner_id
         FROM tournament_matches
         WHERE tournament_id = $1 AND round_number = $2
         ORDER BY match_number`,
        [match.tournament_id, match.round_number]
      );

      const winnerIds = winners.rows.map(w => w.winner_id);

      // Create next round matches
      for (let i = 0; i < winnerIds.length; i += 2) {
        await client.query(
          `INSERT INTO tournament_matches 
           (tournament_id, round_number, match_number, player1_id, player2_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [match.tournament_id, match.round_number + 1, Math.floor(i/2) + 1, winnerIds[i], winnerIds[i+1]]
        );
      }

      // If this was the final match, update tournament status
      if (winnerIds.length === 2) {
        await client.query(
          `UPDATE tournaments 
           SET status = 'completed'
           WHERE id = $1`,
          [match.tournament_id]
        );
      }
    }

    await client.query('COMMIT');

    res.status(200).json({ message: 'Match updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleListTournaments(req: NextApiRequest, res: NextApiResponse) {
  const { status, venueId, limit = 10, offset = 0 } = req.query;

  let query = `
    SELECT t.*, 
           v.name as venue_name,
           COUNT(DISTINCT tp.player_id) as participant_count
    FROM tournaments t
    JOIN venues v ON t.venue_id = v.id
    LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
  `;

  const queryParams: any[] = [];
  const conditions: string[] = [];

  if (status) {
    queryParams.push(status);
    conditions.push(`t.status = $${queryParams.length}`);
  }

  if (venueId) {
    queryParams.push(venueId);
    conditions.push(`t.venue_id = $${queryParams.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY t.id, v.name';
  query += ' ORDER BY t.start_date DESC';
  
  queryParams.push(limit, offset);
  query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

  const result = await pool.query(query, queryParams);

  res.status(200).json({
    tournaments: result.rows,
    count: result.rowCount
  });
} 