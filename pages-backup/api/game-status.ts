import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    player: {
      level: 15,
      xp: 1250,
      clan: 'Crimson Monkey',
      achievements: 8,
    },
    game: {
      status: 'active',
      currentMatch: null,
      availableTournaments: 3,
    },
    world: {
      territories: 12,
      activePlayers: 47,
    },
  });
}
