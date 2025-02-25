import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  try {
    const session = await getSession({ req });

    switch (req.method) {
      case 'GET':
        return handleGetGame(req, res, id);
      case 'POST':
        if (!session?.user?.id) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        return handleGameAction(req, res, id, session.user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling game request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetGame(req: NextApiRequest, res: NextApiResponse, gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: {
        select: {
          id: true,
          username: true,
          rating: true,
          avatar_url: true,
        },
      },
      player2: {
        select: {
          id: true,
          username: true,
          rating: true,
          avatar_url: true,
        },
      },
      venue: {
        select: {
          id: true,
          name: true,
        },
      },
      frames: {
        orderBy: {
          frame_number: 'asc',
        },
        select: {
          frame_number: true,
          player1_score: true,
          player2_score: true,
        },
      },
      shots: {
        orderBy: {
          timestamp: 'asc',
        },
        select: {
          id: true,
          player_id: true,
          type: true,
          points: true,
          timestamp: true,
        },
      },
    },
  });

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json({
    id: game.id,
    status: game.status,
    game_type: game.game_type,
    player1: game.player1,
    player2: game.player2,
    venue_name: game.venue.name,
    venue_id: game.venue.id,
    start_time: game.start_time,
    end_time: game.end_time,
    current_frame: game.current_frame,
    frames: game.frames,
    current_player_id: game.current_player_id,
    shots: game.shots,
    winner_id: game.winner_id,
  });
}

async function handleGameAction(
  req: NextApiRequest,
  res: NextApiResponse,
  gameId: string,
  userId: string
) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      player1_id: true,
      player2_id: true,
    },
  });

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Check if user is a participant
  if (game.player1_id !== userId && game.player2_id !== userId) {
    return res.status(403).json({ error: 'Not authorized to modify this game' });
  }

  const action = req.query.action as string;

  switch (action) {
    case 'start':
      if (game.status !== 'scheduled') {
        return res.status(400).json({ error: 'Game cannot be started' });
      }

      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'in_progress',
          current_player_id: game.player1_id, // Player 1 starts
          start_time: new Date(),
        },
      });

      return res.status(200).json({ message: 'Game started successfully' });

    case 'end':
      if (game.status !== 'in_progress') {
        return res.status(400).json({ error: 'Game cannot be ended' });
      }

      // Get final scores
      const frames = await prisma.frame.findMany({
        where: { game_id: gameId },
        orderBy: { frame_number: 'desc' },
        take: 1,
      });

      const lastFrame = frames[0];
      const winnerId =
        lastFrame.player1_score > lastFrame.player2_score
          ? game.player1_id
          : lastFrame.player1_score < lastFrame.player2_score
          ? game.player2_id
          : null;

      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'completed',
          end_time: new Date(),
          winner_id: winnerId,
        },
      });

      // Update player ratings if it was a ranked game
      // This would be implemented in a separate function
      // await updatePlayerRatings(gameId);

      return res.status(200).json({ message: 'Game ended successfully' });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
} 