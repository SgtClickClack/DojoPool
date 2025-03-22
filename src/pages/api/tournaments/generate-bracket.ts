import { NextApiRequest, NextApiResponse } from 'next';
import { TournamentService } from '../../../../dojopool/services/tournament/service';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { tournament_id } = req.body;

    if (!tournament_id) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }

    // Generate bracket
    const [success, matches, error] = await TournamentService.generate_bracket(tournament_id);

    if (!success || !matches) {
      return res.status(400).json({ error: error || 'Failed to generate tournament bracket' });
    }

    return res.status(200).json({
      matches: matches.map(match => match.to_dict())
    });
  } catch (error) {
    console.error('Error generating tournament bracket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 