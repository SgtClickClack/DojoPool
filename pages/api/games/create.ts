import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { game_type, player2_id, venue_id, start_time } = req.body;

    // Validate required fields
    if (!game_type || !player2_id || !venue_id || !start_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate game type
    if (!['casual', 'ranked', 'tournament'].includes(game_type)) {
      return res.status(400).json({ error: 'Invalid game type' });
    }

    // Validate start time is in the future
    if (new Date(start_time) < new Date()) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }

    // Check if player2 exists
    const player2 = await prisma.user.findUnique({
      where: { id: player2_id },
    });

    if (!player2) {
      return res.status(404).json({ error: 'Opponent not found' });
    }

    // Check if venue exists and is active
    const venue = await prisma.venue.findUnique({
      where: { id: venue_id },
      select: { is_active: true },
    });

    if (!venue || !venue.is_active) {
      return res.status(404).json({ error: 'Venue not found or inactive' });
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        game_type,
        status: 'scheduled',
        start_time: new Date(start_time),
        player1: {
          connect: { id: session.user.id },
        },
        player2: {
          connect: { id: player2_id },
        },
        venue: {
          connect: { id: venue_id },
        },
        frames: {
          create: {
            frame_number: 1,
            player1_score: 0,
            player2_score: 0,
          },
        },
      },
    });

    // Create initial game state in Redis for real-time updates
    // This would be implemented when we set up the WebSocket server
    // await initializeGameState(game.id);

    return res.status(201).json({
      gameId: game.id,
      message: 'Game created successfully',
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return res.status(500).json({ error: 'Failed to create game' });
  }
} 