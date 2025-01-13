import React, { useMemo } from 'react';
import { Card, Tag } from 'antd';
import { TournamentMatch, TournamentParticipant } from '../../types/tournament';

interface Props {
  matches: TournamentMatch[];
  totalRounds: number;
}

interface MatchNode {
  match: TournamentMatch;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MATCH_HEIGHT = 80;
const MATCH_WIDTH = 200;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 40;

const TournamentBracket: React.FC<Props> = ({ matches, totalRounds }) => {
  const matchNodes = useMemo(() => {
    const nodes: MatchNode[] = [];
    const matchesByRound = matches.reduce(
      (acc, match) => {
        acc[match.round_number] = acc[match.round_number] || [];
        acc[match.round_number].push(match);
        return acc;
      },
      {} as Record<number, TournamentMatch[]>
    );

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matchesByRound[round] || [];
      const matchesInRound = roundMatches.length;
      const totalHeight = matchesInRound * MATCH_HEIGHT + (matchesInRound - 1) * VERTICAL_GAP;
      const startY = (window.innerHeight - totalHeight) / 2;

      roundMatches.forEach((match, index) => {
        nodes.push({
          match,
          x: (round - 1) * (MATCH_WIDTH + HORIZONTAL_GAP),
          y: startY + index * (MATCH_HEIGHT + VERTICAL_GAP),
          width: MATCH_WIDTH,
          height: MATCH_HEIGHT,
        });
      });
    }

    return nodes;
  }, [matches, totalRounds]);

  const renderMatchNode = (node: MatchNode) => {
    const { match, x, y, width, height } = node;
    const nextMatch = matches.find((m) => m.id === match.next_match_id);

    return (
      <React.Fragment key={match.id}>
        <foreignObject x={x} y={y} width={width} height={height}>
          <Card size="small" className="tournament-bracket__match" style={{ height: '100%' }}>
            <div className="tournament-bracket__players">
              <div
                className={`tournament-bracket__player ${
                  match.winner_id === match.player1?.id ? 'winner' : ''
                }`}
              >
                {match.player1?.username || 'TBD'}
              </div>
              <div
                className={`tournament-bracket__player ${
                  match.winner_id === match.player2?.id ? 'winner' : ''
                }`}
              >
                {match.player2?.username || 'TBD'}
              </div>
            </div>
            {match.score && (
              <div className="tournament-bracket__score">{JSON.stringify(match.score)}</div>
            )}
          </Card>
        </foreignObject>
        {nextMatch && (
          <path
            d={`M ${x + width} ${y + height / 2} 
                           H ${x + width + HORIZONTAL_GAP / 2}
                           V ${nextMatch.y + height / 2}
                           H ${nextMatch.x}`}
            stroke="#d9d9d9"
            fill="none"
          />
        )}
      </React.Fragment>
    );
  };

  const svgWidth = totalRounds * (MATCH_WIDTH + HORIZONTAL_GAP);
  const svgHeight = window.innerHeight;

  return (
    <div className="tournament-bracket">
      <svg width={svgWidth} height={svgHeight} className="tournament-bracket__svg">
        {matchNodes.map(renderMatchNode)}
      </svg>
    </div>
  );
};

export default TournamentBracket;
