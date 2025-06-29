import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Visibility,
  VisibilityOff,
  CameraAlt,
  Settings,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Download,
  Upload,
  Refresh,
  Close,
  CheckCircle,
  Schedule,
  EmojiEvents,
  TrendingUp,
  Analytics
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease'
  }
}));

const BracketNode = styled(Box)(({ theme }) => ({
  width: 120,
  height: 80,
  background: 'linear-gradient(135deg, #2a2a4e 0%, #1a1a3e 100%)',
  border: '2px solid #00d4ff',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#ff6b35',
    boxShadow: '0 0 20px rgba(255, 107, 53, 0.5)',
    transform: 'scale(1.05)'
  },
  '&.selected': {
    borderColor: '#ffd700',
    boxShadow: '0 0 25px rgba(255, 215, 0, 0.6)',
    transform: 'scale(1.1)'
  },
  '&.completed': {
    borderColor: '#4caf50',
    boxShadow: '0 0 15px rgba(76, 175, 80, 0.4)'
  }
}));

const ConnectionLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  height: '2px',
  background: 'linear-gradient(90deg, #00d4ff, #ff6b35)',
  boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
  zIndex: 1
}));

const TournamentBracket3D: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('default');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 15, z: 20 });
  const [lighting, setLighting] = useState({ ambient: 0.4, directional: 0.8 });
  const [effects, setEffects] = useState({ shadows: true, bloom: false, depthOfField: false });

  // Mock bracket data
  const [bracketData, setBracketData] = useState({
    nodes: [
      // Round 1
      { id: 'r1-1', round: 1, match: 1, player1: 'Alex Chen', player2: 'Sarah Johnson', winner: null, status: 'pending', position: { x: -12, y: 0, z: -10 } },
      { id: 'r1-2', round: 1, match: 2, player1: 'Mike Rodriguez', player2: 'Emma Wilson', winner: null, status: 'pending', position: { x: -8, y: 0, z: -10 } },
      { id: 'r1-3', round: 1, match: 3, player1: 'David Kim', player2: 'Lisa Thompson', winner: null, status: 'pending', position: { x: -4, y: 0, z: -10 } },
      { id: 'r1-4', round: 1, match: 4, player1: 'James Brown', player2: 'Maria Garcia', winner: null, status: 'pending', position: { x: 0, y: 0, z: -10 } },
      { id: 'r1-5', round: 1, match: 5, player1: 'Robert Lee', player2: 'Jennifer Davis', winner: null, status: 'pending', position: { x: 4, y: 0, z: -10 } },
      { id: 'r1-6', round: 1, match: 6, player1: 'Christopher White', player2: 'Amanda Miller', winner: null, status: 'pending', position: { x: 8, y: 0, z: -10 } },
      { id: 'r1-7', round: 1, match: 7, player1: 'Daniel Taylor', player2: 'Jessica Anderson', winner: null, status: 'pending', position: { x: 12, y: 0, z: -10 } },
      { id: 'r1-8', round: 1, match: 8, player1: 'Matthew Martinez', player2: 'Nicole Clark', winner: null, status: 'pending', position: { x: 16, y: 0, z: -10 } },
      
      // Round 2
      { id: 'r2-1', round: 2, match: 1, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: -9, y: 0, z: 0 } },
      { id: 'r2-2', round: 2, match: 2, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: -3, y: 0, z: 0 } },
      { id: 'r2-3', round: 2, match: 3, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: 3, y: 0, z: 0 } },
      { id: 'r2-4', round: 2, match: 4, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: 9, y: 0, z: 0 } },
      
      // Round 3
      { id: 'r3-1', round: 3, match: 1, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: -6, y: 0, z: 10 } },
      { id: 'r3-2', round: 3, match: 2, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: 6, y: 0, z: 10 } },
      
      // Final
      { id: 'final', round: 4, match: 1, player1: 'TBD', player2: 'TBD', winner: null, status: 'pending', position: { x: 0, y: 0, z: 20 } }
    ],
    connections: [
      { from: 'r1-1', to: 'r2-1' },
      { from: 'r1-2', to: 'r2-1' },
      { from: 'r1-3', to: 'r2-2' },
      { from: 'r1-4', to: 'r2-2' },
      { from: 'r1-5', to: 'r2-3' },
      { from: 'r1-6', to: 'r2-3' },
      { from: 'r1-7', to: 'r2-4' },
      { from: 'r1-8', to: 'r2-4' },
      { from: 'r2-1', to: 'r3-1' },
      { from: 'r2-2', to: 'r3-1' },
      { from: 'r2-3', to: 'r3-2' },
      { from: 'r2-4', to: 'r3-2' },
      { from: 'r3-1', to: 'final' },
      { from: 'r3-2', to: 'final' }
    ]
  });

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    const node = bracketData.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedMatch({
        id: nodeId,
        player1: { name: node.player1, score: 0 },
        player2: { name: node.player2, score: 0 },
        status: node.status,
        round: node.round,
        match: node.match
      });
      setShowMatchDetails(true);
    }
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  const startMatch = (nodeId: string) => {
    setBracketData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, status: 'in_progress' } : node
      )
    }));
    setShowMatchDetails(false);
  };

  const completeMatch = (nodeId: string, winner: string) => {
    setBracketData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, status: 'completed', winner };
        }
        // Update next round matches
        if (node.round > 1 && node.player1 === 'TBD') {
          const connection = prev.connections.find(conn => conn.to === node.id);
          if (connection) {
            const fromNode = prev.nodes.find(n => n.id === connection.from);
            if (fromNode?.winner) {
              return { ...node, player1: fromNode.winner };
            }
          }
        }
        return node;
      })
    }));
    setShowMatchDetails(false);
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#ff9800';
      case 'pending': return '#00d4ff';
      default: return '#666';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <PlayArrow />;
      case 'pending': return <Schedule />;
      default: return <Schedule />;
    }
  };

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" color="#00d4ff" sx={{ fontWeight: 'bold' }}>
          3D Tournament Bracket
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setShowSettings(true)}
            sx={{ borderColor: '#00d4ff', color: '#00d4ff' }}
          >
            Settings
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ borderColor: '#00d4ff', color: '#00d4ff' }}
          >
            Export
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Refresh />}
            sx={{ backgroundColor: '#00d4ff', color: '#000' }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* 3D Bracket Container */}
      <StyledCard>
        <CardContent sx={{ p: 0, position: 'relative', height: '600px', overflow: 'hidden' }}>
          {/* Camera Controls */}
          <Box position="absolute" top={16} right={16} zIndex={10}>
            <Box display="flex" gap={1} mb={2}>
              <Tooltip title="Zoom In">
                <IconButton sx={{ color: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton sx={{ color: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate Left">
                <IconButton sx={{ color: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                  <RotateLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate Right">
                <IconButton sx={{ color: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                  <RotateRight />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton sx={{ color: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }}>
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* View Controls */}
          <Box position="absolute" top={16} left={16} zIndex={10}>
            <Box display="flex" gap={1}>
              <Button
                variant={currentView === 'default' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCurrentView('default')}
                sx={{ 
                  backgroundColor: currentView === 'default' ? '#00d4ff' : 'transparent',
                  color: currentView === 'default' ? '#000' : '#00d4ff',
                  borderColor: '#00d4ff'
                }}
              >
                Overview
              </Button>
              <Button
                variant={currentView === 'closeup' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCurrentView('closeup')}
                sx={{ 
                  backgroundColor: currentView === 'closeup' ? '#00d4ff' : 'transparent',
                  color: currentView === 'closeup' ? '#000' : '#00d4ff',
                  borderColor: '#00d4ff'
                }}
              >
                Close-up
              </Button>
              <Button
                variant={currentView === 'topdown' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCurrentView('topdown')}
                sx={{ 
                  backgroundColor: currentView === 'topdown' ? '#00d4ff' : 'transparent',
                  color: currentView === 'topdown' ? '#000' : '#00d4ff',
                  borderColor: '#00d4ff'
                }}
              >
                Top Down
              </Button>
            </Box>
          </Box>

          {/* 3D Scene */}
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)',
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Connection Lines */}
            {bracketData.connections.map((connection, index) => {
              const fromNode = bracketData.nodes.find(n => n.id === connection.from);
              const toNode = bracketData.nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;
              
              const fromX = fromNode.position.x + 60;
              const fromY = fromNode.position.y + 40;
              const toX = toNode.position.x + 60;
              const toY = toNode.position.y + 40;
              
              const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
              const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
              
              return (
                <ConnectionLine
                  key={index}
                  sx={{
                    width: length,
                    left: fromX,
                    top: fromY,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%'
                  }}
                />
              );
            })}

            {/* Bracket Nodes */}
            {bracketData.nodes.map((node) => (
              <BracketNode
                key={node.id}
                className={`${selectedNode === node.id ? 'selected' : ''} ${node.status === 'completed' ? 'completed' : ''}`}
                sx={{
                  position: 'absolute',
                  left: node.position.x + 60,
                  top: node.position.y + 40,
                  zIndex: node.round,
                  transform: `scale(${1 + node.round * 0.1})`
                }}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
              >
                <Typography variant="caption" color="#00d4ff" sx={{ fontSize: '10px' }}>
                  Round {node.round} - Match {node.match}
                </Typography>
                
                <Typography variant="body2" color="#ffffff" sx={{ fontSize: '11px', textAlign: 'center' }}>
                  {node.player1}
                </Typography>
                
                <Typography variant="body2" color="#ffffff" sx={{ fontSize: '11px', textAlign: 'center' }}>
                  vs
                </Typography>
                
                <Typography variant="body2" color="#ffffff" sx={{ fontSize: '11px', textAlign: 'center' }}>
                  {node.player2}
                </Typography>
                
                <Box position="absolute" top={-8} right={-8}>
                  <Chip
                    icon={getNodeStatusIcon(node.status)}
                    label={node.status}
                    size="small"
                    sx={{
                      backgroundColor: getNodeStatusColor(node.status),
                      color: '#ffffff',
                      fontSize: '8px',
                      height: '20px'
                    }}
                  />
                </Box>
                
                {node.winner && (
                  <Box position="absolute" bottom={-8} left="50%" sx={{ transform: 'translateX(-50%)' }}>
                    <Chip
                      icon={<EmojiEvents />}
                      label="Winner"
                      size="small"
                      sx={{
                        backgroundColor: '#ffd700',
                        color: '#000',
                        fontSize: '8px',
                        height: '20px'
                      }}
                    />
                  </Box>
                )}
              </BracketNode>
            ))}
          </Box>
        </CardContent>
      </StyledCard>

      {/* Match Details Dialog */}
      <Dialog
        open={showMatchDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid #00d4ff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#00d4ff' }}>
          Match Details
          <IconButton
            onClick={() => setShowMatchDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#00d4ff' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <Box>
              <Typography variant="h6" color="#ffffff" gutterBottom>
                Round {selectedMatch.round} - Match {selectedMatch.match}
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, background: 'rgba(0, 212, 255, 0.1)', border: '1px solid #00d4ff' }}>
                    <Typography variant="subtitle1" color="#00d4ff" gutterBottom>
                      {selectedMatch.player1.name}
                    </Typography>
                    <Typography variant="h4" color="#ffffff">
                      {selectedMatch.player1.score}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, background: 'rgba(255, 107, 53, 0.1)', border: '1px solid #ff6b35' }}>
                    <Typography variant="subtitle1" color="#ff6b35" gutterBottom>
                      {selectedMatch.player2.name}
                    </Typography>
                    <Typography variant="h4" color="#ffffff">
                      {selectedMatch.player2.score}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box display="flex" gap={2}>
                {selectedMatch.status === 'pending' && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => startMatch(selectedMatch.id)}
                    sx={{ backgroundColor: '#00d4ff', color: '#000' }}
                  >
                    Start Match
                  </Button>
                )}
                
                {selectedMatch.status === 'in_progress' && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => completeMatch(selectedMatch.id, selectedMatch.player1.name)}
                      sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                    >
                      {selectedMatch.player1.name} Wins
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => completeMatch(selectedMatch.id, selectedMatch.player2.name)}
                      sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                    >
                      {selectedMatch.player2.name} Wins
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid #00d4ff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#00d4ff' }}>
          3D Settings
          <IconButton
            onClick={() => setShowSettings(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#00d4ff' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="#00d4ff" gutterBottom>
                Camera Settings
              </Typography>
              
              <Typography variant="body2" color="#ffffff" gutterBottom>
                Ambient Light Intensity
              </Typography>
              <Slider
                value={lighting.ambient}
                onChange={(_, value) => setLighting(prev => ({ ...prev, ambient: value as number }))}
                min={0}
                max={1}
                step={0.1}
                sx={{ color: '#00d4ff' }}
              />
              
              <Typography variant="body2" color="#ffffff" gutterBottom>
                Directional Light Intensity
              </Typography>
              <Slider
                value={lighting.directional}
                onChange={(_, value) => setLighting(prev => ({ ...prev, directional: value as number }))}
                min={0}
                max={1}
                step={0.1}
                sx={{ color: '#00d4ff' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="#00d4ff" gutterBottom>
                Visual Effects
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={effects.shadows}
                    onChange={(e) => setEffects(prev => ({ ...prev, shadows: e.target.checked }))}
                    sx={{ color: '#00d4ff' }}
                  />
                }
                label="Shadows"
                sx={{ color: '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={effects.bloom}
                    onChange={(e) => setEffects(prev => ({ ...prev, bloom: e.target.checked }))}
                    sx={{ color: '#00d4ff' }}
                  />
                }
                label="Bloom Effect"
                sx={{ color: '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={effects.depthOfField}
                    onChange={(e) => setEffects(prev => ({ ...prev, depthOfField: e.target.checked }))}
                    sx={{ color: '#00d4ff' }}
                  />
                }
                label="Depth of Field"
                sx={{ color: '#ffffff' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSettings(false)}
            sx={{ color: '#00d4ff' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentBracket3D; 