import {
  createTournament,
  generateBrackets,
  getTournamentById,
  registerPlayer,
} from '../../core/src/tournament.service';

// Mock Express request and response objects
const mockRequest = (body: any, params: any = {}) => ({
  body,
  params,
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export const createTournamentHandler = async (req: any, res: any) => {
  const {
    name,
    venueId,
    organizerId,
    type,
    format,
    entryFee,
    prizePool,
    maxPlayers,
    checkInPeriodMinutes,
  } = req.body;
  try {
    const tournament = await createTournament(
      name,
      venueId,
      organizerId,
      type,
      format,
      entryFee,
      prizePool,
      maxPlayers,
      checkInPeriodMinutes,
      new Date(req.body.startDate)
    );
    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
};

export const registerPlayerHandler = async (req: any, res: any) => {
  const { tournamentId } = req.params;
  const { userId } = req.body;
  try {
    const participant = await registerPlayer(tournamentId, userId);
    res.status(201).json(participant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTournamentBracketHandler = async (req: any, res: any) => {
  const { tournamentId } = req.params;
  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const { bracket } = await generateBrackets(tournament.id);
    res.status(200).json(bracket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tournament bracket' });
  }
};
