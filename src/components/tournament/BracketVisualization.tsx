import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
  Paper,
  useTheme,
  alpha,
  Zoom,
  Fade,
} from '@mui/material';
import {
  EmojiEvents,
  SportsEsports,
  KeyboardArrowRight,
  KeyboardArrowLeft,
  Info,
  Star,
  LocalFireDepartment,
} from '@mui/icons-material';
import { Tournament, Match, Participant } from '../../types/tournament';

interface BracketVisualizationProps {
  tournament: Tournament;
  onMatchClick?: (match: Match) => void;
  highlightUserId?: string;
  enableRealTimeUpdates?: boolean;
}

interface MatchNode {
  match: Match;
  x: number;
  y: number;
  width: number;
  height: number;
  round: number;
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  tournament,
  onMatchClick,
  highlightUserId,
  enableRealTimeUpdates = true,
}) => {
  const theme = useTheme();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<Match | null>(null);
  const [matchNodes, setMatchNodes] = useState<MatchNode[]>([]);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  // Calculate bracket layout
  useEffect(() => {
    if (!tournament.matches || tournament.matches.length === 0) return;

    const rounds = tournament.matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    const nodes: MatchNode[] = [];
    const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const maxRound = Math.max(...roundKeys);
    
    const matchHeight = 100;
    const matchWidth = 250;
    const roundGap = 300;
    const matchGap = 20;

    roundKeys.forEach((round, roundIndex) => {
      const matches = rounds[round];
      const totalHeight = matches.length * (matchHeight + matchGap) - matchGap;
      const startY = (600 - totalHeight) / 2;

      matches.forEach((match, matchIndex) => {
        nodes.push({
          match,
          x: roundIndex * roundGap + 50,
          y: startY + matchIndex * (matchHeight + matchGap),
          width: matchWidth,
          height: matchHeight,
          round,
        });
      });
    });

    setMatchNodes(nodes);
  }, [tournament.matches]);

  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return neonColors.primary;
      case 'in_progress':
        return neonColors.secondary;
      case 'pending':
        return neonColors.warning;
      case 'bye':
        return neonColors.purple;
      default:
        return theme.palette.grey[500];
    }
  };

  const isUserInMatch = (match: Match) => {
    if (!highlightUserId) return false;
    return (
      match.participant1?.id === highlightUserId ||
      match.participant2?.id === highlightUserId
    );
  };

  const isUserWinner = (match: Match) => {
    if (!highlightUserId || !match.winner) return false;
    return match.winner.id === highlightUserId;
  };

  const renderMatch = (node: MatchNode) => {
    const { match } = node;
    const isHighlighted = isUserInMatch(match);
    const isWinner = isUserWinner(match);
    const isHovered = hoveredMatch?.id === match.id;
    const isSelected = selectedMatch?.id === match.id;

    return (
      <Box
        key={match.id}
        onClick={() => {
          setSelectedMatch(match);
          onMatchClick?.(match);
        }}
        onMouseEnter={() => setHoveredMatch(match)}
        onMouseLeave={() => setHoveredMatch(null)}
        sx={{
          position: 'absolute',
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          zIndex: isHovered || isSelected ? 10 : 1,
        }}
      >
        <Paper
          elevation={isHovered ? 10 : 3}
          sx={{
            width: '100%',
            height: '100%',
            background: alpha(theme.palette.background.paper, 0.9),
            border: `2px solid ${
              isHighlighted ? neonColors.info : getMatchStatusColor(match.status)
            }`,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 0 ${isHovered ? '30px' : '15px'} ${alpha(
              isHighlighted ? neonColors.info : getMatchStatusColor(match.status),
              isHovered ? 0.6 : 0.3
            )}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha(
                getMatchStatusColor(match.status),
                0.2
              )}, transparent)`,
              animation: match.status === 'in_progress' ? 'sweep 2s infinite' : 'none',
            },
            '@keyframes sweep': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' },
            },
          }}
        >
          <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Match Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: getMatchStatusColor(match.status),
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Round {node.round}
              </Typography>
              <Chip
                label={match.status}
                size="small"
                sx={{
                  background: alpha(getMatchStatusColor(match.status), 0.2),
                  color: getMatchStatusColor(match.status),
                  border: `1px solid ${getMatchStatusColor(match.status)}`,
                  height: 20,
                  fontSize: '0.7rem',
                  textShadow: `0 0 5px ${getMatchStatusColor(match.status)}`,
                }}
              />
            </Box>

            {/* Participants */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Participant 1 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  opacity: match.winner && match.winner.id !== match.participant1?.id ? 0.5 : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    background: match.participant1 ? neonColors.info : 'transparent',
                    border: `2px solid ${neonColors.info}`,
                    fontSize: '0.8rem',
                  }}
                >
                  {match.participant1?.username?.[0] || '?'}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: match.winner?.id === match.participant1?.id ? neonColors.primary : '#fff',
                    fontWeight: match.winner?.id === match.participant1?.id ? 'bold' : 'normal',
                    textShadow:
                      match.winner?.id === match.participant1?.id
                        ? `0 0 10px ${neonColors.primary}`
                        : 'none',
                  }}
                >
                  {match.participant1?.username || 'TBD'}
                </Typography>
                {match.score && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: neonColors.warning,
                      fontWeight: 'bold',
                    }}
                  >
                    {match.score.split('-')[0]}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: neonColors.secondary,
                    mx: 1,
                    fontWeight: 'bold',
                  }}
                >
                  VS
                </Typography>
              </Box>

              {/* Participant 2 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: match.winner && match.winner.id !== match.participant2?.id ? 0.5 : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    background: match.participant2 ? neonColors.info : 'transparent',
                    border: `2px solid ${neonColors.info}`,
                    fontSize: '0.8rem',
                  }}
                >
                  {match.participant2?.username?.[0] || '?'}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: match.winner?.id === match.participant2?.id ? neonColors.primary : '#fff',
                    fontWeight: match.winner?.id === match.participant2?.id ? 'bold' : 'normal',
                    textShadow:
                      match.winner?.id === match.participant2?.id
                        ? `0 0 10px ${neonColors.primary}`
                        : 'none',
                  }}
                >
                  {match.participant2?.username || 'TBD'}
                </Typography>
                {match.score && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: neonColors.warning,
                      fontWeight: 'bold',
                    }}
                  >
                    {match.score.split('-')[1]}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Status Indicators */}
          {match.status === 'in_progress' && (
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.2)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              <LocalFireDepartment sx={{ color: neonColors.error, fontSize: 20 }} />
            </Box>
          )}

          {isWinner && (
            <Box
              sx={{
                position: 'absolute',
                top: 5,
                right: 5,
              }}
            >
              <Star sx={{ color: neonColors.warning, fontSize: 20 }} />
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Draw connections between matches
  const renderConnections = () => {
    const connections: React.ReactElement[] = [];
    
    matchNodes.forEach((node, index) => {
      const nextRoundNodes = matchNodes.filter(n => n.round === node.round + 1);
      const targetNode = nextRoundNodes.find(n => {
        // Simple logic to find which match in the next round this match connects to
        const matchIndexInRound = matchNodes.filter(m => m.round === node.round).indexOf(node);
        const targetIndex = Math.floor(matchIndexInRound / 2);
        return nextRoundNodes.indexOf(n) === targetIndex;
      });

      if (targetNode) {
        const startX = node.x + node.width;
        const startY = node.y + node.height / 2;
        const endX = targetNode.x;
        const endY = targetNode.y + targetNode.height / 2;
        const midX = (startX + endX) / 2;

        connections.push(
          <svg
            key={`connection-${node.match.id}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <defs>
              <linearGradient id={`gradient-${node.match.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor={getMatchStatusColor(node.match.status)}
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor={neonColors.info}
                  stopOpacity="0.3"
                />
              </linearGradient>
            </defs>
            <path
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              stroke={`url(#gradient-${node.match.id})`}
              strokeWidth="2"
              fill="none"
              strokeDasharray={node.match.status === 'pending' ? '5,5' : '0'}
              opacity={node.match.status === 'completed' ? 1 : 0.5}
            >
              {node.match.status === 'in_progress' && (
                <animate
                  attributeName="stroke-dashoffset"
                  values="10;0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </svg>
        );
      }
    });

    return connections;
  };

  if (!tournament.matches || tournament.matches.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background: alpha(theme.palette.background.paper, 0.5),
          border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <SportsEsports
            sx={{
              fontSize: 80,
              color: neonColors.info,
              mb: 2,
              filter: `drop-shadow(0 0 20px ${neonColors.info})`,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: neonColors.primary,
              textShadow: `0 0 10px ${neonColors.primary}`,
              mb: 1,
            }}
          >
            Bracket Generation Pending
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            The tournament bracket will be generated once registration is complete
          </Typography>
        </Box>
      </Box>
    );
  }

  const maxRound = Math.max(...matchNodes.map(n => n.round));
  const bracketWidth = (maxRound + 1) * 300 + 100;
  const bracketHeight = 600;

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <EmojiEvents sx={{ color: neonColors.warning, fontSize: 40 }} />
        Tournament Bracket
      </Typography>

      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          width: '100%',
          height: bracketHeight,
          background: alpha(theme.palette.background.default, 0.95),
          border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            height: 12,
            width: 12,
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.background.paper, 0.5),
            borderRadius: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
            borderRadius: 6,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: bracketWidth,
            height: '100%',
            minWidth: '100%',
          }}
        >
          {/* Grid background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(${alpha(neonColors.primary, 0.05)} 1px, transparent 1px),
                linear-gradient(90deg, ${alpha(neonColors.primary, 0.05)} 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              zIndex: 0,
            }}
          />

          {/* Connections */}
          {renderConnections()}

          {/* Matches */}
          {matchNodes.map(node => renderMatch(node))}

          {/* Round Labels */}
          {Array.from(new Set(matchNodes.map(n => n.round))).map(round => {
            const roundNodes = matchNodes.filter(n => n.round === round);
            const minY = Math.min(...roundNodes.map(n => n.y));
            const isLastRound = round === maxRound;
            
            return (
              <Box
                key={`round-label-${round}`}
                sx={{
                  position: 'absolute',
                  left: roundNodes[0].x,
                  top: minY - 40,
                  width: roundNodes[0].width,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: isLastRound ? neonColors.warning : neonColors.info,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 'bold',
                    textShadow: `0 0 10px ${isLastRound ? neonColors.warning : neonColors.info}`,
                  }}
                >
                  {isLastRound ? '🏆 FINAL' : `ROUND ${round}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Legend */}
      <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Object.entries({
          pending: 'Pending',
          in_progress: 'In Progress',
          completed: 'Completed',
        }).map(([status, label]) => (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1,
                background: alpha(getMatchStatusColor(status), 0.2),
                border: `2px solid ${getMatchStatusColor(status)}`,
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default BracketVisualization;