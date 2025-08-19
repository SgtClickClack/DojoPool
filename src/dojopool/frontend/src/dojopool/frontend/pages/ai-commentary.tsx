import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Mic,
  PlayArrow,
  Pause,
  VolumeUp,
  Analytics,
  TrendingUp,
  Psychology,
  SportsEsports,
} from '@mui/icons-material';
import Layout from '../src/components/layout/Layout';
import PageBackground from '../src/components/common/PageBackground';
import { AIMatchAnalysisComponent } from '../src/components/ai/AIMatchAnalysisComponent';
import { LiveCommentary } from '../src/components/ai/LiveCommentary';

const AICommentaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'live' | 'analysis' | 'coaching' | 'highlights'
  >('live');
  const [isLiveCommentaryActive, setIsLiveCommentaryActive] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState<
    'professional' | 'excited' | 'analytical' | 'casual'
  >('professional');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentMatch, setCurrentMatch] = useState({
    id: 'demo-match-001',
    player1: { id: 'player1', name: 'ShadowStriker', rating: 1850 },
    player2: { id: 'player2', name: 'PoolMaster2024', rating: 1920 },
    score: { player1: 8, player2: 6 },
    status: 'active',
  });

  // Mock game state for demonstration
  const [gameState] = useState({
    currentPlayerId: 'player1',
    shots: [
      {
        id: 'shot1',
        playerId: 'player1',
        type: 'break',
        success: true,
        power: 85,
        accuracy: 92,
        timestamp: new Date(Date.now() - 30000),
        commentary:
          "Incredible break shot! ShadowStriker shows why they're ranked 1850!",
      },
      {
        id: 'shot2',
        playerId: 'player2',
        type: 'safety',
        success: true,
        power: 45,
        accuracy: 88,
        timestamp: new Date(Date.now() - 20000),
        commentary:
          'Smart safety play by PoolMaster2024, forcing a difficult position.',
      },
      {
        id: 'shot3',
        playerId: 'player1',
        type: 'clutch',
        success: true,
        power: 90,
        accuracy: 95,
        timestamp: new Date(Date.now() - 10000),
        commentary: 'CLUTCH SHOT! ShadowStriker under pressure and delivers!',
      },
    ],
    players: [
      { id: 'player1', name: 'ShadowStriker', rating: 1850 },
      { id: 'player2', name: 'PoolMaster2024', rating: 1920 },
    ],
  });

  const [aiAnalysis, setAiAnalysis] = useState({
    matchPrediction: {
      predictedWinner: 'ShadowStriker',
      confidence: 78,
      reasoning: 'Superior break and run percentage, better pressure handling',
    },
    player1Analysis: {
      accuracy: 88,
      consistency: 85,
      strategy: 92,
      pressureHandling: 90,
    },
    player2Analysis: {
      accuracy: 92,
      consistency: 88,
      strategy: 85,
      pressureHandling: 82,
    },
    keyMoments: [
      {
        id: 'moment1',
        timestamp: new Date(Date.now() - 30000),
        description: 'ShadowStriker executes perfect break shot',
        impact: 'high',
        excitementLevel: 95,
      },
      {
        id: 'moment2',
        timestamp: new Date(Date.now() - 20000),
        description:
          'PoolMaster2024 shows tactical brilliance with safety play',
        impact: 'medium',
        excitementLevel: 75,
      },
      {
        id: 'moment3',
        timestamp: new Date(Date.now() - 10000),
        description: 'ShadowStriker hits clutch shot under pressure',
        impact: 'high',
        excitementLevel: 98,
      },
    ],
  });

  const handleCommentaryUpdate = (commentary: any) => {
    console.log('New commentary:', commentary);
  };

  const toggleLiveCommentary = () => {
    setIsLiveCommentaryActive(!isLiveCommentaryActive);
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'professional':
        return '#00a8ff';
      case 'excited':
        return '#ff6b6b';
      case 'analytical':
        return '#00ff9d';
      case 'casual':
        return '#feca57';
      default:
        return '#00a8ff';
    }
  };

  return (
    <Layout>
      <PageBackground variant="ai">
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
              textAlign: 'center',
            }}
          >
            🤖 AI Commentary & Analysis
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
            }}
          >
            Real-time AI-powered match commentary, analysis, and coaching
          </Typography>

          {/* Current Match Status */}
          <Box sx={{ mb: 4 }}>
            <Card
              sx={{
                background: 'rgba(26, 26, 26, 0.9)',
                border: '2px solid #00ff9d',
                borderRadius: 3,
                boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#00ff9d',
                    mb: 2,
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  🎯 Live Match: {currentMatch.player1.name} vs{' '}
                  {currentMatch.player2.name}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                    >
                      {currentMatch.player1.name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                      {currentMatch.score.player1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Rating: {currentMatch.player1.rating}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', mx: 2 }}>
                    <Typography
                      variant="h4"
                      sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
                    >
                      VS
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
                    >
                      {currentMatch.player2.name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                      {currentMatch.score.player2}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Rating: {currentMatch.player2.rating}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={currentMatch.status.toUpperCase()}
                  sx={{
                    backgroundColor:
                      currentMatch.status === 'active' ? '#00ff9d' : '#00a8ff',
                    color: '#000',
                    fontWeight: 'bold',
                  }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Tab Navigation */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'live', label: 'Live Commentary', icon: <Mic /> },
                { key: 'analysis', label: 'AI Analysis', icon: <Analytics /> },
                { key: 'coaching', label: 'AI Coaching', icon: <Psychology /> },
                {
                  key: 'highlights',
                  label: 'Highlights',
                  icon: <SportsEsports />,
                },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab(tab.key as any)}
                  startIcon={tab.icon}
                  sx={{
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    ...(activeTab === tab.key
                      ? {
                          background:
                            'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                          color: '#000',
                          '&:hover': {
                            background:
                              'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                          },
                        }
                      : {
                          border: '2px solid #00a8ff',
                          color: '#00a8ff',
                          '&:hover': {
                            border: '2px solid #00ff9d',
                            color: '#00ff9d',
                          },
                        }),
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Commentary Style Controls */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#00a8ff',
                mb: 2,
                fontFamily: 'Orbitron, monospace',
              }}
            >
              🎙️ Commentary Style
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {['professional', 'excited', 'analytical', 'casual'].map(
                (style) => (
                  <Button
                    key={style}
                    variant={
                      commentaryStyle === style ? 'contained' : 'outlined'
                    }
                    onClick={() => setCommentaryStyle(style as any)}
                    sx={{
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      ...(commentaryStyle === style
                        ? {
                            backgroundColor: getStyleColor(style),
                            color: '#000',
                            '&:hover': {
                              backgroundColor: getStyleColor(style),
                              opacity: 0.8,
                            },
                          }
                        : {
                            border: `2px solid ${getStyleColor(style)}`,
                            color: getStyleColor(style),
                            '&:hover': {
                              border: `2px solid ${getStyleColor(style)}`,
                              color: getStyleColor(style),
                            },
                          }),
                    }}
                  >
                    {style}
                  </Button>
                )
              )}
            </Box>
          </Box>

          {/* Content Based on Active Tab */}
          <Box>
            {activeTab === 'live' && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={toggleLiveCommentary}
                    startIcon={
                      isLiveCommentaryActive ? <Pause /> : <PlayArrow />
                    }
                    sx={{
                      background: isLiveCommentaryActive
                        ? 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)'
                        : 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                      color: '#000',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      '&:hover': {
                        background: isLiveCommentaryActive
                          ? 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)'
                          : 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                      },
                    }}
                  >
                    {isLiveCommentaryActive
                      ? 'Pause Commentary'
                      : 'Start Live Commentary'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    startIcon={<VolumeUp />}
                    sx={{
                      border: '2px solid #00a8ff',
                      color: audioEnabled ? '#00ff9d' : '#00a8ff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      '&:hover': {
                        border: '2px solid #00ff9d',
                        color: '#00ff9d',
                      },
                    }}
                  >
                    {audioEnabled ? 'Audio On' : 'Audio Off'}
                  </Button>
                </Box>

                <Card
                  sx={{
                    background: 'rgba(26, 26, 26, 0.9)',
                    border: '2px solid #00a8ff',
                    borderRadius: 3,
                    boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    minHeight: '400px',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        mb: 2,
                        fontFamily: 'Orbitron, monospace',
                      }}
                    >
                      🎙️ Live AI Commentary
                    </Typography>
                    <LiveCommentary
                      gameState={gameState}
                      selectedStyle={commentaryStyle}
                      audioEnabled={audioEnabled}
                      onCommentary={handleCommentaryUpdate}
                    />
                  </CardContent>
                </Card>
              </Box>
            )}

            {activeTab === 'analysis' && (
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '2px solid #00ff9d',
                  borderRadius: 3,
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#00ff9d',
                      mb: 2,
                      fontFamily: 'Orbitron, monospace',
                    }}
                  >
                    📊 AI Match Analysis
                  </Typography>
                  <AIMatchAnalysisComponent
                    matchId={currentMatch.id}
                    player1Id={currentMatch.player1.id}
                    player2Id={currentMatch.player2.id}
                    onAnalysisUpdate={setAiAnalysis}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'coaching' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card
                  sx={{
                    background: 'rgba(26, 26, 26, 0.9)',
                    border: '2px solid #feca57',
                    borderRadius: 3,
                    boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#feca57',
                        mb: 2,
                        fontFamily: 'Orbitron, monospace',
                      }}
                    >
                      🧠 AI Personal Coach
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <Typography
                          variant="h6"
                          sx={{ color: '#feca57', mb: 1 }}
                        >
                          {currentMatch.player1.name} - Performance Analysis
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: '#ccc', mb: 0.5 }}
                          >
                            Shot Accuracy
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={aiAnalysis.player1Analysis.accuracy}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(254, 202, 87, 0.2)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#feca57',
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: '#feca57', mt: 0.5 }}
                          >
                            {aiAnalysis.player1Analysis.accuracy}%
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: '#ccc', mb: 0.5 }}
                          >
                            Pressure Handling
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={aiAnalysis.player1Analysis.pressureHandling}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(254, 202, 87, 0.2)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#feca57',
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: '#feca57', mt: 0.5 }}
                          >
                            {aiAnalysis.player1Analysis.pressureHandling}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '300px' }}>
                        <Typography
                          variant="h6"
                          sx={{ color: '#feca57', mb: 1 }}
                        >
                          AI Coaching Recommendations
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            • Focus on defensive positioning in tight situations
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            • Practice break shot consistency under pressure
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            • Develop mental resilience for clutch moments
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            • Improve safety play effectiveness
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {activeTab === 'highlights' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ color: '#ff6b6b', fontFamily: 'Orbitron, monospace' }}
                >
                  🎬 Match Highlights
                </Typography>
                {aiAnalysis.keyMoments.map((moment, index) => (
                  <Card
                    key={moment.id}
                    sx={{
                      background: 'rgba(26, 26, 26, 0.9)',
                      border: '2px solid #ff6b6b',
                      borderRadius: 3,
                      boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#ff6b6b',
                            fontFamily: 'Orbitron, monospace',
                          }}
                        >
                          Highlight #{index + 1}
                        </Typography>
                        <Chip
                          label={`${moment.excitementLevel}% Excitement`}
                          sx={{
                            backgroundColor:
                              moment.excitementLevel > 90
                                ? '#ff6b6b'
                                : '#feca57',
                            color: '#000',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>
                        {moment.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Impact: {moment.impact.toUpperCase()} •{' '}
                        {moment.timestamp.toLocaleTimeString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default AICommentaryPage;
