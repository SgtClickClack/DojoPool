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

    // Register participant
    const [success, participant, error] = await TournamentService.register_participant(
      tournament_id,
      user.id
    );

    if (!success || !participant) {
      return res.status(400).json({ error: error || 'Failed to register for tournament' });
    }

    return res.status(201).json(participant.to_dict());
  } catch (error) {
    console.error('Error registering for tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 