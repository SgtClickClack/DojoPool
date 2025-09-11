import express from 'express';
import {
  createTournamentHandler,
  getTournamentBracketHandler,
  registerPlayerHandler,
} from './tournament.controller';

const router = express.Router();

router.post('/tournaments/create', createTournamentHandler);
router.post('/tournaments/:tournamentId/register', registerPlayerHandler);
router.get('/tournaments/:tournamentId/bracket', getTournamentBracketHandler);

export default router;
