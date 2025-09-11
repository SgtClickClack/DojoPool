'use client';

import {
  ExpandMore,
  PlayArrow,
  Refresh,
  Science,
  Speed,
  Stop,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Slider,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Import WebAssembly physics engine
import poolPhysicsWasm from '../wasm/pool-physics.js';

interface TrajectoryPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  time: number;
  valid: boolean;
}

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  radius: number;
  active: boolean;
  id: number;
}

const PhysicsDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [ballStates, setBallStates] = useState<BallState[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  // Physics parameters
  const [power, setPower] = useState(0.5);
  const [spinX, setSpinX] = useState(0);
  const [spinY, setSpinY] = useState(0);
  const [targetX, setTargetX] = useState(6.0);
  const [targetY, setTargetY] = useState(2.25);

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const TABLE_SCALE = 80; // pixels per foot

  // Initialize WebAssembly engine
  const initializeEngine = useCallback(async () => {
    if (isInitialized) return;

    setIsInitializing(true);
    try {
      await poolPhysicsWasm.initialize();
      setIsInitialized(true);
      console.log('✅ WebAssembly physics engine initialized');

      // Set up initial table state
      poolPhysicsWasm.setupStandardTable();
      updateBallStates();
    } catch (error) {
      console.error('❌ Failed to initialize WebAssembly engine:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized]);

  // Update ball states from WebAssembly engine
  const updateBallStates = useCallback(() => {
    if (!isInitialized) return;
    const states = poolPhysicsWasm.getBallStates();
    setBallStates(states);
  }, [isInitialized]);

  // Calculate trajectory
  const calculateTrajectory = useCallback(() => {
    if (!isInitialized) return;

    poolPhysicsWasm.clearBalls();

    // Add cue ball at starting position
    poolPhysicsWasm.addBall(1.0, 2.25, 0, 0, 0, 0, 0);

    // Calculate shot trajectory
    const shotResult = poolPhysicsWasm.calculateShot(
      1.0,
      2.25,
      targetX,
      targetY,
      power,
      spinX,
      spinY
    );

    if (shotResult.valid) {
      // Calculate full trajectory from shot result
      const trajectory = poolPhysicsWasm.calculateTrajectory(0, 8.0);
      setTrajectory(trajectory);
    }

    updateBallStates();
  }, [isInitialized, targetX, targetY, power, spinX, spinY]);

  // Run physics simulation
  const runSimulation = useCallback(() => {
    if (!isInitialized || isRunning) return;

    setIsRunning(true);

    const simulate = () => {
      poolPhysicsWasm.simulateStep(1 / 60);
      updateBallStates();

      // Check if simulation should continue
      const states = poolPhysicsWasm.getBallStates();
      const hasMovingBalls = states.some((ball) => {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        return speed > 0.01;
      });

      if (hasMovingBalls) {
        animationRef.current = requestAnimationFrame(simulate);
      } else {
        setIsRunning(false);
      }
    };

    // Start simulation
    poolPhysicsWasm.clearBalls();
    poolPhysicsWasm.addBall(1.0, 2.25, power * 3, 0, spinX, spinY, 0);
    simulate();
  }, [isInitialized, isRunning, power, spinX, spinY, updateBallStates]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsRunning(false);
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    stopSimulation();
    poolPhysicsWasm.setupStandardTable();
    setTrajectory([]);
    updateBallStates();
  }, [stopSimulation, updateBallStates]);

  // Run performance benchmark
  const runBenchmark = useCallback(async () => {
    if (!isInitialized) return;

    console.log('🏃 Running physics benchmark...');
    const results = await poolPhysicsWasm.benchmark(1000);
    setPerformance(results);

    // Run comparative benchmark
    const benchmark = new (
      await import('../wasm/physics-benchmark.js')
    ).default();
    const comparativeResults = await benchmark.runAllBenchmarks();
    setBenchmarkResults(comparativeResults);

    console.log('✅ Benchmark complete:', results);
  }, [isInitialized]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pool table
    ctx.strokeStyle = '#2a5c2a';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, 720, 320);

    // Draw cushions
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 720, 320);

    // Draw pockets
    const pockets = [
      [40, 40],
      [400, 35],
      [760, 40],
      [40, 360],
      [400, 365],
      [760, 360],
    ];

    ctx.fillStyle = '#000';
    pockets.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw trajectory
    if (trajectory.length > 0) {
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 2;
      ctx.beginPath();

      trajectory.forEach((point, index) => {
        const x = 40 + point.x * TABLE_SCALE;
        const y = 40 + (4.5 - point.y) * TABLE_SCALE; // Flip Y axis

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw balls
    ballStates.forEach((ball) => {
      const x = 40 + ball.x * TABLE_SCALE;
      const y = 40 + (4.5 - ball.y) * TABLE_SCALE;

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, ball.radius * TABLE_SCALE, 0, 2 * Math.PI);
      ctx.fill();

      // Ball
      ctx.fillStyle =
        ball.id === 0
          ? '#fff' // Cue ball
          : ball.id === 8
            ? '#000' // 8-ball
            : ball.id < 8
              ? '#ff6b6b'
              : '#00a8ff'; // Solids vs stripes

      ctx.beginPath();
      ctx.arc(x, y, ball.radius * TABLE_SCALE, 0, 2 * Math.PI);
      ctx.fill();

      // Ball number
      if (ball.id > 0) {
        ctx.fillStyle = ball.id === 8 ? '#fff' : '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ball.id.toString(), x, y + 4);
      }
    });

    // Draw target
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const targetCanvasX = 40 + targetX * TABLE_SCALE;
    const targetCanvasY = 40 + (4.5 - targetY) * TABLE_SCALE;
    ctx.arc(targetCanvasX, targetCanvasY, 20, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [trajectory, ballStates, targetX, targetY]);

  // Initialize on mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (isInitializing) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#00ff9d' }}>
            Initializing WebAssembly Physics Engine...
          </Typography>
          <LinearProgress
            sx={{
              bgcolor: '#333',
              '& .MuiLinearProgress-bar': { bgcolor: '#00ff9d' },
            }}
          />
        </Box>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="h6">WebAssembly Not Available</Typography>
        <Typography>
          The WebAssembly physics engine could not be loaded. Some features may
          not work properly.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, color: '#00ff9d', textAlign: 'center' }}
      >
        🏓 DojoPool Physics Engine Demo
      </Typography>

      <Grid container spacing={3}>
        {/* Main Canvas */}
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Pool Table Simulation
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={isRunning ? 'Running' : 'Stopped'}
                    color={isRunning ? 'success' : 'default'}
                    size="small"
                  />
                  {performance && (
                    <Chip
                      label={`${performance.iterationsPerSecond.toFixed(0)} ops/sec`}
                      color="primary"
                      size="small"
                      icon={<Speed />}
                    />
                  )}
                </Box>
              </Box>

              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  border: '2px solid #333',
                  borderRadius: '8px',
                  background: '#0a0a0a',
                  width: '100%',
                  height: 'auto',
                }}
              />

              {/* Controls */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={runSimulation}
                  disabled={isRunning}
                  sx={{
                    bgcolor: '#00ff9d',
                    color: '#000',
                    '&:hover': { bgcolor: '#00cc7a' },
                  }}
                >
                  Run Simulation
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Stop />}
                  onClick={stopSimulation}
                  disabled={!isRunning}
                  sx={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
                >
                  Stop
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetSimulation}
                  sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}
                >
                  Reset
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={runBenchmark}
                  sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
                >
                  Benchmark
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Controls Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Physics Controls
              </Typography>

              {/* Shot Parameters */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#00ff9d', mb: 2 }}
                >
                  Shot Parameters
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Power: {(power * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={power}
                    onChange={(_, value) => setPower(value as number)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    sx={{
                      color: '#00ff9d',
                      '& .MuiSlider-thumb': { bgcolor: '#00ff9d' },
                      '& .MuiSlider-track': { bgcolor: '#00ff9d' },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Spin X: {spinX.toFixed(2)}
                  </Typography>
                  <Slider
                    value={spinX}
                    onChange={(_, value) => setSpinX(value as number)}
                    min={-2}
                    max={2}
                    step={0.1}
                    sx={{
                      color: '#00a8ff',
                      '& .MuiSlider-thumb': { bgcolor: '#00a8ff' },
                      '& .MuiSlider-track': { bgcolor: '#00a8ff' },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    Spin Y: {spinY.toFixed(2)}
                  </Typography>
                  <Slider
                    value={spinY}
                    onChange={(_, value) => setSpinY(value as number)}
                    min={-2}
                    max={2}
                    step={0.1}
                    sx={{
                      color: '#ff6b6b',
                      '& .MuiSlider-thumb': { bgcolor: '#ff6b6b' },
                      '& .MuiSlider-track': { bgcolor: '#ff6b6b' },
                    }}
                  />
                </Box>
              </Box>

              {/* Target Position */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#ffaa00', mb: 2 }}
                >
                  Target Position
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      X: {targetX.toFixed(1)} ft
                    </Typography>
                    <Slider
                      value={targetX}
                      onChange={(_, value) => setTargetX(value as number)}
                      min={0}
                      max={9}
                      step={0.1}
                      sx={{
                        color: '#ffaa00',
                        '& .MuiSlider-thumb': { bgcolor: '#ffaa00' },
                        '& .MuiSlider-track': { bgcolor: '#ffaa00' },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                      Y: {targetY.toFixed(1)} ft
                    </Typography>
                    <Slider
                      value={targetY}
                      onChange={(_, value) => setTargetY(value as number)}
                      min={0}
                      max={4.5}
                      step={0.1}
                      sx={{
                        color: '#ffaa00',
                        '& .MuiSlider-thumb': { bgcolor: '#ffaa00' },
                        '& .MuiSlider-track': { bgcolor: '#ffaa00' },
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={calculateTrajectory}
                sx={{
                  bgcolor: '#00a8ff',
                  color: '#fff',
                  '&:hover': { bgcolor: '#0088cc' },
                }}
              >
                Calculate Trajectory
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Results */}
      {(performance || benchmarkResults) && (
        <Card sx={{ mt: 3, bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              📊 Performance Results
            </Typography>

            <Accordion sx={{ bgcolor: '#2a2a2a' }}>
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#00ff9d' }} />}
              >
                <Typography sx={{ color: '#00ff9d' }}>
                  WebAssembly Physics Engine Performance
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {performance && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Total Time: {performance.totalTime.toFixed(2)}ms
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Average per Iteration:{' '}
                      {performance.avgTimePerIteration.toFixed(4)}ms
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                    >
                      Operations/Second:{' '}
                      {performance.iterationsPerSecond.toFixed(0)}
                    </Typography>
                  </Box>
                )}

                {benchmarkResults && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#ffaa00', mb: 1 }}
                    >
                      Benchmark Results:
                    </Typography>
                    {benchmarkResults.map((result: any, index: number) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                          {result.testName}: {result.opsPerSecond.toFixed(0)}{' '}
                          ops/sec
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: '#2a2a2a', border: '1px solid #444' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#00ff9d' }}>
          🎯 How to Use
        </Typography>
        <Typography variant="body2" sx={{ color: '#ccc', lineHeight: 1.6 }}>
          1. Adjust shot parameters (power, spin) and target position
          <br />
          2. Click "Calculate Trajectory" to see the predicted ball path
          <br />
          3. Click "Run Simulation" to see real-time physics
          <br />
          4. Use "Benchmark" to measure WebAssembly performance
          <br />
          5. The red dashed circle shows your target position
        </Typography>
      </Paper>
    </Box>
  );
};

export default PhysicsDemo;
