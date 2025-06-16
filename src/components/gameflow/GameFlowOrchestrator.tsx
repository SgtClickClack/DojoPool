import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha,
  Fade,
  Zoom,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  TableBar,
  SportsEsports,
  Person,
  EmojiEvents,
  NavigateNext,
  QrCodeScanner,
  LocationOn,
  Timeline,
  Analytics,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CheckInSystem } from '../venue/CheckInSystem';
import { GamePlay } from '../game/GamePlay';
import { ShotAnalysis } from '../game/ShotAnalysis';

interface GameFlowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
  action?: () => void;
}

interface GameFlowOrchestratorProps {
  venueId?: string;
  tournamentId?: string;
  onComplete?: (gameData: any) => void;
}

export const GameFlowOrchestrator: React.FC<GameFlowOrchestratorProps> = ({
  venueId,
  tournamentId,
  onComplete,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [gameData, setGameData] = useState<any>({
    checkInData: null,
    tableData: null,
    gameSession: null,
    results: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const steps: GameFlowStep[] = [
    {
      id: 'venue-checkin',
      label: 'Venue Check-in',
      description: 'Verify your presence at the venue',
      icon: <QrCodeScanner />,
      component: (
        <CheckInSystem
          venueId={venueId || ''}
          onCheckInComplete={(data) => {
            setGameData(prev => ({ ...prev, checkInData: data }));
            handleNext();
          }}
        />
      ),
    },
    {
      id: 'table-selection',
      label: 'Table Selection',
      description: 'Choose your pool table',
      icon: <TableBar />,
      component: (
        <TableSelection
          venueId={venueId}
          onTableSelected={(table) => {
            setGameData(prev => ({ ...prev, tableData: table }));
            handleNext();
          }}
        />
      ),
    },
    {
      id: 'game-setup',
      label: 'Game Setup',
      description: 'Configure game settings and find opponent',
      icon: <Person />,
      component: (
        <GameSetup
          tableId={gameData.tableData?.id}
          tournamentId={tournamentId}
          onSetupComplete={(session) => {
            setGameData(prev => ({ ...prev, gameSession: session }));
            handleNext();
          }}
        />
      ),
    },
    {
      id: 'live-game',
      label: 'Live Game',
      description: 'Play with AI tracking and real-time updates',
      icon: <SportsEsports />,
      component: (
        <Box>
          <GamePlay
            gameId={gameData.gameSession?.id}
            playerId={user?.uid || ''}
            opponentId={gameData.gameSession?.opponentId}
            onGameComplete={(results) => {
              setGameData(prev => ({ ...prev, results }));
              handleNext();
            }}
          />
          <Box sx={{ mt: 3 }}>
            <ShotAnalysis gameId={gameData.gameSession?.id} />
          </Box>
        </Box>
      ),
    },
    {
      id: 'game-complete',
      label: 'Game Complete',
      description: 'Review results and claim rewards',
      icon: <EmojiEvents />,
      component: (
        <GameComplete
          results={gameData.results}
          onComplete={() => {
            if (onComplete) {
              onComplete(gameData);
            } else {
              navigate('/dashboard');
            }
          }}
        />
      ),
    },
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setGameData({
      checkInData: null,
      tableData: null,
      gameSession: null,
      results: null,
    });
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < activeStep) return 'completed';
    if (stepIndex === activeStep) return 'active';
    return 'inactive';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return neonColors.primary;
      case 'active':
        return neonColors.info;
      default:
        return alpha(theme.palette.text.secondary, 0.5);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 30px ${alpha(neonColors.primary, 0.5)}`,
            mb: 1,
          }}
        >
          Game Flow
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          Complete your journey from check-in to champion
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress
          variant="determinate"
          value={(activeStep / (steps.length - 1)) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(neonColors.primary, 0.2),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${neonColors.primary} 0%, ${neonColors.info} 100%)`,
              boxShadow: `0 0 20px ${neonColors.primary}`,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: neonColors.primary }}>
            Step {activeStep + 1} of {steps.length}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {Math.round((activeStep / (steps.length - 1)) * 100)}% Complete
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          mb: 4,
          overflow: 'visible',
        }}
      >
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const color = getStepColor(status);
              
              return (
                <Step key={step.id}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: alpha(color, 0.2),
                          border: `2px solid ${color}`,
                          color: color,
                          boxShadow: status === 'active' ? `0 0 20px ${color}` : 'none',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          '&::before': status === 'active' ? {
                            content: '""',
                            position: 'absolute',
                            inset: -6,
                            borderRadius: '50%',
                            border: `2px solid ${alpha(color, 0.3)}`,
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', opacity: 1 },
                              '50%': { transform: 'scale(1.1)', opacity: 0.5 },
                              '100%': { transform: 'scale(1)', opacity: 1 },
                            },
                          } : {},
                        }}
                      >
                        {status === 'completed' ? <CheckCircle /> : step.icon}
                      </Box>
                    )}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: color,
                        fontWeight: status === 'active' ? 'bold' : 'normal',
                        textShadow: status === 'active' ? `0 0 10px ${color}` : 'none',
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {step.description}
                    </Typography>
                  </StepLabel>
                  
                  <StepContent>
                    <Fade in timeout={500}>
                      <Box sx={{ mt: 2, mb: 3 }}>
                        {step.component}
                      </Box>
                    </Fade>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Current Step Details */}
      {activeStep < steps.length && (
        <Zoom in>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.info, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `2px solid ${alpha(neonColors.info, 0.5)}`,
              borderRadius: 2,
              boxShadow: `0 0 30px ${alpha(neonColors.info, 0.3)}`,
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  fontSize: 64,
                  color: neonColors.info,
                  mb: 2,
                  filter: `drop-shadow(0 0 20px ${neonColors.info})`,
                }}
              >
                {steps[activeStep].icon}
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: neonColors.info,
                  fontWeight: 'bold',
                  mb: 1,
                  textShadow: `0 0 10px ${neonColors.info}`,
                }}
              >
                {steps[activeStep].label}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                {steps[activeStep].description}
              </Typography>
              
              {loading && (
                <CircularProgress
                  sx={{
                    color: neonColors.info,
                    filter: `drop-shadow(0 0 10px ${neonColors.info})`,
                  }}
                />
              )}
              
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    background: alpha(neonColors.error, 0.1),
                    border: `1px solid ${neonColors.error}`,
                    color: neonColors.error,
                    '& .MuiAlert-icon': { color: neonColors.error },
                  }}
                >
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Zoom>
      )}

      {/* Game Data Summary */}
      {Object.values(gameData).some(v => v !== null) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ color: neonColors.secondary, mb: 2 }}>
            Progress Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {gameData.checkInData && (
              <Chip
                icon={<CheckCircle />}
                label="Checked In"
                sx={{
                  background: alpha(neonColors.primary, 0.2),
                  color: neonColors.primary,
                  border: `1px solid ${neonColors.primary}`,
                }}
              />
            )}
            {gameData.tableData && (
              <Chip
                icon={<TableBar />}
                label={`Table ${gameData.tableData.number}`}
                sx={{
                  background: alpha(neonColors.warning, 0.2),
                  color: neonColors.warning,
                  border: `1px solid ${neonColors.warning}`,
                }}
              />
            )}
            {gameData.gameSession && (
              <Chip
                icon={<SportsEsports />}
                label="Game Started"
                sx={{
                  background: alpha(neonColors.info, 0.2),
                  color: neonColors.info,
                  border: `1px solid ${neonColors.info}`,
                }}
              />
            )}
            {gameData.results && (
              <Chip
                icon={<EmojiEvents />}
                label={gameData.results.winner === user?.uid ? 'Victory!' : 'Game Complete'}
                sx={{
                  background: alpha(neonColors.secondary, 0.2),
                  color: neonColors.secondary,
                  border: `1px solid ${neonColors.secondary}`,
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Placeholder components - these would be separate files in production
const TableSelection: React.FC<any> = ({ venueId, onTableSelected }) => {
  // Implementation would go here
  return (
    <Box>
      <Typography>Table Selection Component</Typography>
      <Button onClick={() => onTableSelected({ id: '1', number: '1' })}>
        Select Table 1
      </Button>
    </Box>
  );
};

const GameSetup: React.FC<any> = ({ tableId, tournamentId, onSetupComplete }) => {
  // Implementation would go here
  return (
    <Box>
      <Typography>Game Setup Component</Typography>
      <Button onClick={() => onSetupComplete({ id: '123', opponentId: '456' })}>
        Start Game
      </Button>
    </Box>
  );
};

const GameComplete: React.FC<any> = ({ results, onComplete }) => {
  // Implementation would go here
  return (
    <Box>
      <Typography>Game Complete Component</Typography>
      <Button onClick={onComplete}>Return to Dashboard</Button>
    </Box>
  );
};

export default GameFlowOrchestrator;