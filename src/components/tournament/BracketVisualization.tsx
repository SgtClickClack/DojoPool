import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  ViewInAr,
  Settings,
  PlayArrow,
  Pause,
  Refresh,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  Fullscreen,
  Close,
  SportsEsports,
  EmojiEvents,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Tune,
  Visibility,
  VisibilityOff,
  Speed,
} from '@mui/icons-material';
import BracketVisualizationService, {
  TournamentBracket,
  BracketNode,
  PlayerInfo,
  BracketConfig,
  MatchUpdate,
} from '../../services/tournament/BracketVisualizationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bracket-tabpanel-${index}`}
      aria-labelledby={`bracket-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BracketVisualization: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [selectedNode, setSelectedNode] = useState<BracketNode | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [config, setConfig] = useState<BracketConfig | null>(null);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState<BracketConfig | null>(null);
  const [matchUpdate, setMatchUpdate] = useState<MatchUpdate | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const bracketService = BracketVisualizationService.getInstance();

  useEffect(() => {
    loadMockBracket();
    return () => {
      bracketService.stopRendering();
    };
  }, []);

  const loadMockBracket = () => {
    const mockBracket: TournamentBracket = {
      id: 'bracket_001',
      name: 'Cyberpunk Championship 2024',
      type: 'single-elimination',
      totalRounds: 4,
      totalMatches: 15,
      currentRound: 1,
      status: 'in-progress',
      startDate: new Date('2024-01-15'),
      players: [
        { id: 'p1', name: 'NeonStriker', avatar: '/images/avatars/player1.jpg', seed: 1, rating: 1850, wins: 12, losses: 3, status: 'active' },
        { id: 'p2', name: 'CyberQueen', avatar: '/images/avatars/player2.jpg', seed: 2, rating: 1820, wins: 10, losses: 5, status: 'active' },
        { id: 'p3', name: 'DigitalDragon', avatar: '/images/avatars/player3.jpg', seed: 3, rating: 1780, wins: 8, losses: 7, status: 'active' },
        { id: 'p4', name: 'MatrixMaster', avatar: '/images/avatars/player4.jpg', seed: 4, rating: 1750, wins: 9, losses: 6, status: 'active' },
        { id: 'p5', name: 'PixelPuncher', avatar: '/images/avatars/player5.jpg', seed: 5, rating: 1720, wins: 7, losses: 8, status: 'active' },
        { id: 'p6', name: 'ByteBrawler', avatar: '/images/avatars/player6.jpg', seed: 6, rating: 1700, wins: 6, losses: 9, status: 'active' },
        { id: 'p7', name: 'CircuitSlayer', avatar: '/images/avatars/player7.jpg', seed: 7, rating: 1680, wins: 5, losses: 10, status: 'active' },
        { id: 'p8', name: 'DataDestroyer', avatar: '/images/avatars/player8.jpg', seed: 8, rating: 1650, wins: 4, losses: 11, status: 'active' },
      ],
      nodes: [
        // Round 1
        { id: 'm1', matchId: 'match_1', player1: { id: 'p1', name: 'NeonStriker', avatar: '/images/avatars/player1.jpg', seed: 1, rating: 1850, wins: 12, losses: 3, status: 'active' }, player2: { id: 'p8', name: 'DataDestroyer', avatar: '/images/avatars/player8.jpg', seed: 8, rating: 1650, wins: 4, losses: 11, status: 'active' }, round: 0, position: 0, status: 'completed', winner: { id: 'p1', name: 'NeonStriker', avatar: '/images/avatars/player1.jpg', seed: 1, rating: 1850, wins: 12, losses: 3, status: 'active' }, score: '9-3', position3D: new THREE.Vector3(), connections: ['m5'] },
        { id: 'm2', matchId: 'match_2', player1: { id: 'p4', name: 'MatrixMaster', avatar: '/images/avatars/player4.jpg', seed: 4, rating: 1750, wins: 9, losses: 6, status: 'active' }, player2: { id: 'p5', name: 'PixelPuncher', avatar: '/images/avatars/player5.jpg', seed: 5, rating: 1720, wins: 7, losses: 8, status: 'active' }, round: 0, position: 1, status: 'completed', winner: { id: 'p4', name: 'MatrixMaster', avatar: '/images/avatars/player4.jpg', seed: 4, rating: 1750, wins: 9, losses: 6, status: 'active' }, score: '9-7', position3D: new THREE.Vector3(), connections: ['m5'] },
        { id: 'm3', matchId: 'match_3', player1: { id: 'p3', name: 'DigitalDragon', avatar: '/images/avatars/player3.jpg', seed: 3, rating: 1780, wins: 8, losses: 7, status: 'active' }, player2: { id: 'p6', name: 'ByteBrawler', avatar: '/images/avatars/player6.jpg', seed: 6, rating: 1700, wins: 6, losses: 9, status: 'active' }, round: 0, position: 2, status: 'completed', winner: { id: 'p3', name: 'DigitalDragon', avatar: '/images/avatars/player3.jpg', seed: 3, rating: 1780, wins: 8, losses: 7, status: 'active' }, score: '9-5', position3D: new THREE.Vector3(), connections: ['m6'] },
        { id: 'm4', matchId: 'match_4', player1: { id: 'p2', name: 'CyberQueen', avatar: '/images/avatars/player2.jpg', seed: 2, rating: 1820, wins: 10, losses: 5, status: 'active' }, player2: { id: 'p7', name: 'CircuitSlayer', avatar: '/images/avatars/player7.jpg', seed: 7, rating: 1680, wins: 5, losses: 10, status: 'active' }, round: 0, position: 3, status: 'completed', winner: { id: 'p2', name: 'CyberQueen', avatar: '/images/avatars/player2.jpg', seed: 2, rating: 1820, wins: 10, losses: 5, status: 'active' }, score: '9-4', position3D: new THREE.Vector3(), connections: ['m6'] },
        
        // Round 2
        { id: 'm5', matchId: 'match_5', player1: { id: 'p1', name: 'NeonStriker', avatar: '/images/avatars/player1.jpg', seed: 1, rating: 1850, wins: 12, losses: 3, status: 'active' }, player2: { id: 'p4', name: 'MatrixMaster', avatar: '/images/avatars/player4.jpg', seed: 4, rating: 1750, wins: 9, losses: 6, status: 'active' }, round: 1, position: 0, status: 'in-progress', score: '5-3', position3D: new THREE.Vector3(), connections: ['m7', 'm1', 'm2'] },
        { id: 'm6', matchId: 'match_6', player1: { id: 'p3', name: 'DigitalDragon', avatar: '/images/avatars/player3.jpg', seed: 3, rating: 1780, wins: 8, losses: 7, status: 'active' }, player2: { id: 'p2', name: 'CyberQueen', avatar: '/images/avatars/player2.jpg', seed: 2, rating: 1820, wins: 10, losses: 5, status: 'active' }, round: 1, position: 1, status: 'pending', position3D: new THREE.Vector3(), connections: ['m7', 'm3', 'm4'] },
        
        // Round 3
        { id: 'm7', matchId: 'match_7', player1: { id: 'p1', name: 'NeonStriker', avatar: '/images/avatars/player1.jpg', seed: 1, rating: 1850, wins: 12, losses: 3, status: 'active' }, player2: { id: 'p2', name: 'CyberQueen', avatar: '/images/avatars/player2.jpg', seed: 2, rating: 1820, wins: 10, losses: 5, status: 'active' }, round: 2, position: 0, status: 'pending', position3D: new THREE.Vector3(), connections: ['m5', 'm6'] },
      ],
    };

    setBracket(mockBracket);
    setConfig(bracketService.getConfig());
    
    // Initialize 3D scene
    if (containerRef.current) {
      bracketService.initializeScene(containerRef.current);
      bracketService.loadBracket(mockBracket);
      setIsRendering(true);
    }

    // Add click handler
    bracketService.addClickHandler((nodeId) => {
      const node = mockBracket.nodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setOpenMatchDialog(true);
      }
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openConfig = () => {
    setTempConfig(bracketService.getConfig());
    setOpenConfigDialog(true);
  };

  const saveConfig = () => {
    if (tempConfig) {
      bracketService.updateConfig(tempConfig);
      setConfig(tempConfig);
    }
    setOpenConfigDialog(false);
  };

  const handleMatchUpdate = () => {
    if (selectedNode && matchUpdate) {
      // Update the match
      const updatedNode = { ...selectedNode, ...matchUpdate };
      setSelectedNode(updatedNode);
      
      // Update bracket
      if (bracket) {
        const updatedBracket = { ...bracket };
        const nodeIndex = updatedBracket.nodes.findIndex(n => n.id === selectedNode.id);
        if (nodeIndex !== -1) {
          updatedBracket.nodes[nodeIndex] = updatedNode;
          setBracket(updatedBracket);
          bracketService.updateBracket(updatedBracket);
        }
      }
      
      setOpenMatchDialog(false);
      setMatchUpdate(null);
    }
  };

  const render3DView = () => (
    <Box sx={{ position: 'relative', height: '600px', width: '100%' }}>
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      />
      
      {/* 3D Controls Overlay */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
        <Tooltip title="Reset Camera">
          <IconButton
            onClick={() => bracketService.resetCamera()}
            sx={{
              backgroundColor: 'rgba(0, 255, 157, 0.2)',
              color: '#00ff9d',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 157, 0.3)',
              },
            }}
          >
            <RotateLeft />
          </IconButton>
        </Tooltip>
        <Tooltip title="Toggle Auto Rotate">
          <IconButton
            onClick={() => bracketService.toggleAutoRotate()}
            sx={{
              backgroundColor: 'rgba(0, 168, 255, 0.2)',
              color: '#00a8ff',
              '&:hover': {
                backgroundColor: 'rgba(0, 168, 255, 0.3)',
              },
            }}
          >
            <Speed />
          </IconButton>
        </Tooltip>
        <Tooltip title="Configuration">
          <IconButton
            onClick={openConfig}
            sx={{
              backgroundColor: 'rgba(254, 202, 87, 0.2)',
              color: '#feca57',
              '&:hover': {
                backgroundColor: 'rgba(254, 202, 87, 0.3)',
              },
            }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderBracketInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              }}
            >
              Tournament Info
            </Typography>

            {bracket && (
              <>
                <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                  {bracket.name}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Type
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00a8ff', fontWeight: 600 }}>
                      {bracket.type.replace('-', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Status
                    </Typography>
                    <Chip
                      label={bracket.status.toUpperCase()}
                      sx={{
                        backgroundColor: bracket.status === 'in-progress' ? '#feca57' : '#00ff9d',
                        color: '#000',
                        fontWeight: 600,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Current Round
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00a8ff', fontWeight: 600 }}>
                      {bracket.currentRound} / {bracket.totalRounds}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Total Matches
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00a8ff', fontWeight: 600 }}>
                      {bracket.totalMatches}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00a8ff',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
              }}
            >
              Match Status
            </Typography>

            {bracket && (
              <List>
                {bracket.nodes.filter(node => node.status === 'in-progress').map((node) => (
                  <ListItem
                    key={node.id}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 255, 157, 0.1)',
                      },
                    }}
                    onClick={() => {
                      setSelectedNode(node);
                      setOpenMatchDialog(true);
                    }}
                  >
                    <ListItemIcon>
                      <SportsEsports sx={{ color: '#feca57' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                          {node.player1.name} vs {node.player2.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Round {node.round + 1} • {node.score || '0-0'}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={node.status === 'in-progress' ? 50 : 100}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#feca57',
                                boxShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
                              },
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderMatchDetails = () => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #feca57',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: '#feca57',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            mb: 2,
            textShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
          }}
        >
          Match Details
        </Typography>

        {bracket && (
          <List>
            {bracket.nodes.map((node) => (
              <ListItem
                key={node.id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 157, 0.1)',
                  },
                }}
                onClick={() => {
                  setSelectedNode(node);
                  setOpenMatchDialog(true);
                }}
              >
                <ListItemIcon>
                  {node.status === 'completed' && <CheckCircle sx={{ color: '#00ff9d' }} />}
                  {node.status === 'in-progress' && <SportsEsports sx={{ color: '#feca57' }} />}
                  {node.status === 'pending' && <Schedule sx={{ color: '#00a8ff' }} />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                      {node.player1.name} vs {node.player2.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        Round {node.round + 1} • {node.score || 'Not started'}
                      </Typography>
                      {node.winner && (
                        <Chip
                          label={`Winner: ${node.winner.name}`}
                          size="small"
                          sx={{
                            backgroundColor: '#00ff9d',
                            color: '#000',
                            fontWeight: 600,
                            mt: 1,
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h3"
        sx={{
          color: '#00ff9d',
          fontFamily: 'Orbitron, monospace',
          fontWeight: 700,
          mb: 4,
          textAlign: 'center',
          textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
        }}
      >
        3D Tournament Bracket Visualization
      </Typography>

      <Paper
        sx={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(0, 255, 157, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            background: 'rgba(30, 30, 30, 0.9)',
            borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
            '& .MuiTab-root': {
              color: '#fff',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              '&.Mui-selected': {
                color: '#00ff9d',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00ff9d',
              boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
            },
          }}
        >
          <Tab label="3D Visualization" />
          <Tab label="Tournament Info" />
          <Tab label="Match Details" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {render3DView()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderBracketInfo()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderMatchDetails()}
        </TabPanel>
      </Paper>

      {/* Configuration Dialog */}
      <Dialog
        open={openConfigDialog}
        onClose={() => setOpenConfigDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace' }}>
          3D Visualization Configuration
        </DialogTitle>
        <DialogContent>
          {tempConfig && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                  Node Spacing: {tempConfig.nodeSpacing}
                </Typography>
                <Slider
                  value={tempConfig.nodeSpacing}
                  onChange={(_, value) => setTempConfig({ ...tempConfig, nodeSpacing: value as number })}
                  min={1}
                  max={5}
                  step={0.5}
                  sx={{
                    color: '#00ff9d',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#00ff9d',
                      boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                    },
                  }}
                />

                <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1, mt: 2 }}>
                  Round Spacing: {tempConfig.roundSpacing}
                </Typography>
                <Slider
                  value={tempConfig.roundSpacing}
                  onChange={(_, value) => setTempConfig({ ...tempConfig, roundSpacing: value as number })}
                  min={2}
                  max={8}
                  step={0.5}
                  sx={{
                    color: '#00ff9d',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#00ff9d',
                      boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                    },
                  }}
                />

                <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1, mt: 2 }}>
                  Camera Distance: {tempConfig.cameraDistance}
                </Typography>
                <Slider
                  value={tempConfig.cameraDistance}
                  onChange={(_, value) => setTempConfig({ ...tempConfig, cameraDistance: value as number })}
                  min={10}
                  max={30}
                  step={1}
                  sx={{
                    color: '#00ff9d',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#00ff9d',
                      boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.autoRotate}
                      onChange={(e) => setTempConfig({ ...tempConfig, autoRotate: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00ff9d',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00ff9d',
                        },
                      }}
                    />
                  }
                  label="Auto Rotate"
                  sx={{ color: '#fff', mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.showConnections}
                      onChange={(e) => setTempConfig({ ...tempConfig, showConnections: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00ff9d',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00ff9d',
                        },
                      }}
                    />
                  }
                  label="Show Connections"
                  sx={{ color: '#fff', mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.showLabels}
                      onChange={(e) => setTempConfig({ ...tempConfig, showLabels: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00ff9d',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00ff9d',
                        },
                      }}
                    />
                  }
                  label="Show Labels"
                  sx={{ color: '#fff', mb: 2 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfigDialog(false)}
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveConfig}
            sx={{
              background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
              color: '#000',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
              },
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Match Update Dialog */}
      <Dialog
        open={openMatchDialog}
        onClose={() => setOpenMatchDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #feca57',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(254, 202, 87, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#feca57', fontFamily: 'Orbitron, monospace' }}>
          Update Match
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                {selectedNode.player1.name} vs {selectedNode.player2.name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Player 1 Score"
                    type="number"
                    defaultValue={selectedNode.score?.split('-')[0] || 0}
                    onChange={(e) => setMatchUpdate({
                      matchId: selectedNode.matchId,
                      player1Score: parseInt(e.target.value),
                      player2Score: parseInt(matchUpdate?.player2Score?.toString() || selectedNode.score?.split('-')[1] || '0'),
                      status: selectedNode.status,
                      timestamp: new Date(),
                    })}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: '#feca57',
                        },
                        '&:hover fieldset': {
                          borderColor: '#00a8ff',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#ccc',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Player 2 Score"
                    type="number"
                    defaultValue={selectedNode.score?.split('-')[1] || 0}
                    onChange={(e) => setMatchUpdate({
                      matchId: selectedNode.matchId,
                      player1Score: parseInt(matchUpdate?.player1Score?.toString() || selectedNode.score?.split('-')[0] || '0'),
                      player2Score: parseInt(e.target.value),
                      status: selectedNode.status,
                      timestamp: new Date(),
                    })}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: '#feca57',
                        },
                        '&:hover fieldset': {
                          borderColor: '#00a8ff',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#ccc',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ccc' }}>Status</InputLabel>
                    <Select
                      defaultValue={selectedNode.status}
                      onChange={(e) => setMatchUpdate({
                        matchId: selectedNode.matchId,
                        player1Score: parseInt(matchUpdate?.player1Score?.toString() || selectedNode.score?.split('-')[0] || '0'),
                        player2Score: parseInt(matchUpdate?.player2Score?.toString() || selectedNode.score?.split('-')[1] || '0'),
                        status: e.target.value as any,
                        timestamp: new Date(),
                      })}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#feca57',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00a8ff',
                        },
                      }}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenMatchDialog(false)}
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMatchUpdate}
            sx={{
              background: 'linear-gradient(45deg, #feca57 0%, #00ff9d 100%)',
              color: '#000',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #00ff9d 0%, #feca57 100%)',
              },
            }}
          >
            Update Match
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BracketVisualization;