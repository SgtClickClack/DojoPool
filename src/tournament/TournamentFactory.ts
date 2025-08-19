import {
  type Tournament,
  type TournamentPlayer,
  type TournamentConfig,
  type TournamentFormat,
} from './types';
import { DoubleEliminationTournament } from './DoubleEliminationTournament';

export class TournamentFactory {
  static createTournament(
    format: TournamentFormat,
    players: TournamentPlayer[],
    config: TournamentConfig
  ): Tournament {
    switch (format) {
      case 'double_elimination':
        return new DoubleEliminationTournament(players, config);
      case 'single_elimination':
      case 'round_robin':
      case 'swiss':
        throw new Error(`Tournament format ${format} not yet implemented`);
      default:
        throw new Error(`Unknown tournament format: ${format}`);
    }
  }
}
