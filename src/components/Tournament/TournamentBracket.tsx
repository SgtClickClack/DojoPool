import React, { useEffect, useState } from 'react';
import { Tournament, TournamentPlayer } from '../../types/tournament';
import './TournamentBracket.css';

interface TournamentBracketProps {
  tournament: Tournament;
}

interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: string;
  score?: { player1: number; player2: number };
  status: 'pending' | 'in_progress' | 'completed';
  nextMatchId?: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
}) => {
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);

  useEffect(() => {
    generateBracket();
  }, [tournament]);

  const generateBracket = () => {
    const totalRounds = Math.ceil(Math.log2(tournament.maxParticipants));
    const matches: BracketMatch[] = [];

    // Generate first round matches
    const firstRoundMatches = Math.floor(tournament.maxParticipants / 2);
    for (let i = 0; i < firstRoundMatches; i++) {
      const match: BracketMatch = {
        id: `r1-m${i + 1}`,
        round: 1,
        matchNumber: i + 1,
        player1: tournament.players?.[i * 2] || undefined,
        player2: tournament.players?.[i * 2 + 1] || undefined,
        status: 'pending',
        nextMatchId: `r2-m${Math.floor(i / 2) + 1}`,
      };
      matches.push(match);
    }

    // Generate subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const roundMatches = Math.ceil(
        firstRoundMatches / Math.pow(2, round - 1)
      );
      for (let i = 0; i < roundMatches; i++) {
        const match: BracketMatch = {
          id: `r${round}-m${i + 1}`,
          round,
          matchNumber: i + 1,
          status: 'pending',
          nextMatchId:
            round < totalRounds
              ? `r${round + 1}-m${Math.floor(i / 2) + 1}`
              : undefined,
        };
        matches.push(match);
      }
    }

    setBracketMatches(matches);
  };

  const handleMatchClick = (match: BracketMatch) => {
    setSelectedMatch(match);
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#888888';
      case 'in_progress':
        return '#0088ff';
      case 'completed':
        return '#00ff88';
      default:
        return '#888888';
    }
  };

  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'Live';
      case 'completed':
        return 'Complete';
      default:
        return status;
    }
  };

  const renderMatch = (match: BracketMatch) => {
    const isFirstRound = match.round === 1;
    const hasPlayers = match.player1 || match.player2;

    return (
      <div
        key={match.id}
        className={`bracket-match ${isFirstRound ? 'first-round' : ''} ${
          selectedMatch?.id === match.id ? 'selected' : ''
        }`}
        onClick={() => handleMatchClick(match)}
      >
        <div className="match-header">
          <span className="match-id">
            R{match.round} M{match.matchNumber}
          </span>
          <div
            className="match-status"
            style={{ backgroundColor: getMatchStatusColor(match.status) }}
          >
            {getMatchStatusText(match.status)}
          </div>
        </div>

        <div className="match-players">
          <div
            className={`player player1 ${
              match.winner === match.player1?.id ? 'winner' : ''
            }`}
          >
            <span className="player-name">{match.player1?.name || 'TBD'}</span>
            {match.score && (
              <span className="player-score">{match.score.player1}</span>
            )}
          </div>

          <div className="match-vs">vs</div>

          <div
            className={`player player2 ${
              match.winner === match.player2?.id ? 'winner' : ''
            }`}
          >
            <span className="player-name">{match.player2?.name || 'TBD'}</span>
            {match.score && (
              <span className="player-score">{match.score.player2}</span>
            )}
          </div>
        </div>

        {match.winner && (
          <div className="match-winner">
            <span className="winner-label">Winner:</span>
            <span className="winner-name">
              {match.player1?.id === match.winner
                ? match.player1.name
                : match.player2?.name}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderRound = (round: number) => {
    const roundMatches = bracketMatches.filter(
      (match) => match.round === round
    );

    return (
      <div key={round} className="bracket-round">
        <h3 className="round-title">Round {round}</h3>
        <div className="round-matches">{roundMatches.map(renderMatch)}</div>
      </div>
    );
  };

  const rounds = [...new Set(bracketMatches.map((match) => match.round))].sort(
    (a, b) => a - b
  );

  return (
    <div className="tournament-bracket">
      <div className="bracket-header">
        <h2>Tournament Bracket</h2>
        <div className="bracket-info">
          <span className="info-item">
            <strong>Total Rounds:</strong> {rounds.length}
          </span>
          <span className="info-item">
            <strong>First Round Matches:</strong>{' '}
            {Math.floor(tournament.maxParticipants / 2)}
          </span>
          <span className="info-item">
            <strong>Participants:</strong> {tournament.currentParticipants}/
            {tournament.maxParticipants}
          </span>
        </div>
      </div>

      <div className="bracket-container">{rounds.map(renderRound)}</div>

      {selectedMatch && (
        <div className="match-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Match Details</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedMatch(null)}
              >
                ×
              </button>
            </div>

            <div className="match-details">
              <div className="detail-row">
                <span className="detail-label">Match ID:</span>
                <span className="detail-value">{selectedMatch.id}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Round:</span>
                <span className="detail-value">{selectedMatch.round}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {getMatchStatusText(selectedMatch.status)}
                </span>
              </div>

              {selectedMatch.player1 && (
                <div className="detail-row">
                  <span className="detail-label">Player 1:</span>
                  <span className="detail-value">
                    {selectedMatch.player1.name}
                  </span>
                </div>
              )}

              {selectedMatch.player2 && (
                <div className="detail-row">
                  <span className="detail-label">Player 2:</span>
                  <span className="detail-value">
                    {selectedMatch.player2.name}
                  </span>
                </div>
              )}

              {selectedMatch.score && (
                <div className="detail-row">
                  <span className="detail-label">Score:</span>
                  <span className="detail-value">
                    {selectedMatch.score.player1} -{' '}
                    {selectedMatch.score.player2}
                  </span>
                </div>
              )}

              {selectedMatch.winner && (
                <div className="detail-row">
                  <span className="detail-label">Winner:</span>
                  <span className="detail-value winner">
                    {selectedMatch.player1?.id === selectedMatch.winner
                      ? selectedMatch.player1.name
                      : selectedMatch.player2?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
