import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        {
          player1: {
            username: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          player2: {
            username: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          venue: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.game_type = type;
    }

    // Get total count for pagination
    const total = await prisma.game.count({ where });

    // Fetch games with related data
    const games = await prisma.game.findMany({
      where,
      include: {
        player1: {
          select: {
            id: true,
            username: true,
            rating: true,
          },
        },
        player2: {
          select: {
            id: true,
            username: true,
            rating: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
        frames: {
          orderBy: {
            frame_number: 'desc',
          },
          take: 1,
          select: {
            player1_score: true,
            player2_score: true,
          },
        },
      },
      orderBy: [
        {
          status: 'asc',
        },
        {
          start_time: 'desc',
        },
      ],
      skip: offset,
      take: limit,
    });

    // Transform the data for the frontend
    const transformedGames = games.map((game) => ({
      id: game.id,
      game_type: game.game_type,
      status: game.status,
      player1: game.player1,
      player2: game.player2,
      venue_name: game.venue.name,
      start_time: game.start_time,
      score_player1: game.frames[0]?.player1_score || 0,
      score_player2: game.frames[0]?.player2_score || 0,
      winner_id: game.winner_id,
    }));

    return res.status(200).json({
      games: transformedGames,
      total,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return res.status(500).json({ error: 'Failed to fetch games' });
  }
} 