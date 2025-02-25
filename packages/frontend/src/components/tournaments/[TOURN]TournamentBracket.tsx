/** @jsxImportSource react */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { TournamentMatch, TournamentParticipant } from '../../types/tournament';

interface TournamentBracketProps {
  matches: TournamentMatch[];
  totalRounds: number;
  loading?: boolean;
  error?: string | null;
  onMatchClick?: (match: TournamentMatch) => void;
  onRefresh?: () => void;
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

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  totalRounds,
  loading = false,
  error = null,
  onMatchClick,
  onRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [svgHeight, setSvgHeight] = useState(window.innerHeight * 0.8);
  const [containerWidth, setContainerWidth] = useState(0);
  const bracketRef = React.useRef<HTMLDivElement>(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (bracketRef.current) {
        setContainerWidth(bracketRef.current.clientWidth);
        setSvgHeight(window.innerHeight * 0.8);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adjust dimensions based on device
  const matchWidth = isMobile ? 150 : MATCH_WIDTH;
  const matchHeight = isMobile ? 60 : MATCH_HEIGHT;
  const horizontalGap = isMobile ? 40 : HORIZONTAL_GAP;

  const matchNodes = useMemo(() => {
    if (!matches.length) return [];
    
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
      const totalHeight = matchesInRound * matchHeight + (matchesInRound - 1) * VERTICAL_GAP;
      const startY = (svgHeight - totalHeight) / 2;

      roundMatches.forEach((match, index) => {
        nodes.push({
          match,
          x: (round - 1) * (matchWidth + horizontalGap),
          y: startY + index * (matchHeight + VERTICAL_GAP),
          width: matchWidth,
          height: matchHeight,
        });
      });
    }

    return nodes;
  }, [matches, totalRounds, svgHeight, matchWidth, matchHeight, horizontalGap]);

  const svgWidth = totalRounds * (matchWidth + horizontalGap);

  // Handle match click with error prevention
  const handleMatchClick = (match: TournamentMatch) => {
    if (onMatchClick) {
      try {
        onMatchClick(match);
      } catch (err) {
        console.error('Error handling match click:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          onRefresh && (
            <Button color="inherit" size="small" onClick={onRefresh}>
              Try Again
            </Button>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  if (!matches.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          No matches available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Matches will appear here once the tournament begins
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        overflowX: 'auto',
        p: 2,
        bgcolor: theme.palette.background.default,
        borderRadius: 1,
      }}
      ref={bracketRef}
    >
      <Box sx={{ width: svgWidth, minHeight: svgHeight }}>
        <svg width={svgWidth} height={svgHeight}>
          {/* Connection lines */}
          {matchNodes.map((node) => {
            const { match } = node;
            const nextMatch = matches.find((m) => m.id === match.next_match_id);
            if (!nextMatch) return null;
            
            const nextNode = matchNodes.find((n) => n.match.id === nextMatch.id);
            if (!nextNode) return null;

            return (
              <path
                key={`line-${match.id}-${nextMatch.id}`}
                d={`M ${node.x + node.width} ${node.y + node.height / 2} 
                   H ${node.x + node.width + horizontalGap / 2}
                   V ${nextNode.y + nextNode.height / 2}
                   H ${nextNode.x}`}
                stroke={theme.palette.divider}
                strokeWidth={2}
                fill="none"
              />
            );
          })}

          {/* Match boxes */}
          {matchNodes.map((node) => {
            const { match, x, y, width, height } = node;
            const isClickable = match.status !== 'not_started' && onMatchClick;
            const matchStatus = match.status === 'completed' 
              ? 'Completed'
              : match.status === 'in_progress'
                ? 'In Progress'
                : 'Not Started';
            
            return (
              <g
                key={`match-${match.id}`}
                onClick={isClickable ? () => handleMatchClick(match) : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <Tooltip title={matchStatus} placement="top">
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={4}
                    fill={theme.palette.background.paper}
                    stroke={
                      match.status === 'completed'
                        ? theme.palette.success.main
                        : match.status === 'in_progress'
                          ? theme.palette.primary.main
                          : theme.palette.divider
                    }
                    strokeWidth={2}
                  />
                </Tooltip>

                {/* Player 1 */}
                <text
                  x={x + 10}
                  y={y + height / 3}
                  fill={match.winner_id === match.player1?.id ? theme.palette.success.main : theme.palette.text.primary}
                  fontWeight={match.winner_id === match.player1?.id ? 'bold' : 'normal'}
                  fontSize={isMobile ? '10px' : '12px'}
                >
                  {match.player1?.username || 'TBD'}
                </text>

                {/* Player 2 */}
                <text
                  x={x + 10}
                  y={y + (height * 2) / 3}
                  fill={match.winner_id === match.player2?.id ? theme.palette.success.main : theme.palette.text.primary}
                  fontWeight={match.winner_id === match.player2?.id ? 'bold' : 'normal'}
                  fontSize={isMobile ? '10px' : '12px'}
                >
                  {match.player2?.username || 'TBD'}
                </text>

                {/* Score */}
                {match.score && (
                  <text
                    x={x + width - 30}
                    y={y + height / 2}
                    fill={theme.palette.text.secondary}
                    textAnchor="end"
                    fontSize={isMobile ? '10px' : '12px'}
                  >
                    {match.score.player1} - {match.score.player2}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
};

export default TournamentBracket;