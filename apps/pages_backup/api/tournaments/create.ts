import { type NextApiRequest, type NextApiResponse } from 'next';
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
    const {
      name,
      description,
      venue_id,
      start_date,
      end_date,
      registration_deadline,
      max_participants,
      entry_fee,
      prize_pool,
      format,
    } = req.body;

    if (
      !name ||
      !venue_id ||
      !start_date ||
      !end_date ||
      !registration_deadline ||
      !max_participants ||
      !format
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create tournament
    const [success, tournament, error] =
      await TournamentService.create_tournament(
        name,
        description,
        venue_id,
        user.id,
        new Date(start_date),
        new Date(end_date),
        new Date(registration_deadline),
        max_participants,
        entry_fee || 0,
        prize_pool || 0,
        format
      );

    if (!success || !tournament) {
      return res
        .status(400)
        .json({ error: error || 'Failed to create tournament' });
    }

    return res.status(201).json(tournament.to_dict());
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
