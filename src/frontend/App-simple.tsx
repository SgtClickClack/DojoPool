import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, Button, Box } from '@mui/material';

// Simple components for testing
const HomePage = () => {
    const [backendStatus, setBackendStatus] = useState<string>('Checking...');
    const [gameData, setGameData] = useState<any>(null);

    useEffect(() => {
        // Test backend connection
        fetch('http://localhost:8080/api/health')
            .then(response => response.json())
            .then(data => {
                setBackendStatus('Connected');
                console.log('Backend health:', data);
            })
            .catch(error => {
                setBackendStatus('Disconnected');
                console.error('Backend error:', error);
            });

        // Get game data
        fetch('http://localhost:8080/api/game-status')
            .then(response => response.json())
            .then(data => {
                setGameData(data);
                console.log('Game data:', data);
            })
            .catch(error => {
                console.error('Game data error:', error);
            });
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
                🎱 DojoPool Platform
            </Typography>

            <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    System Status
                </Typography>
                <Typography variant="body1" color={backendStatus === 'Connected' ? 'success.main' : 'error.main'}>
                    Backend: {backendStatus}
                </Typography>
            </Box>

            {gameData && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Player Stats
                                </Typography>
                                <Typography variant="body2">
                                    Level: {gameData.player.level}
                                </Typography>
                                <Typography variant="body2">
                                    XP: {gameData.player.xp}
                                </Typography>
                                <Typography variant="body2">
                                    Clan: {gameData.player.clan}
                                </Typography>
                                <Typography variant="body2">
                                    Achievements: {gameData.player.achievements}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Territory Control
                                </Typography>
                                <Typography variant="body2">
                                    Owned: {gameData.territory.owned}
                                </Typography>
                                <Typography variant="body2">
                                    Total: {gameData.territory.total}
                                </Typography>
                                <Typography variant="body2">
                                    Objective: {gameData.territory.currentObjective}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Game Features
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">🎮 Game Features</Typography>
                                <Typography variant="body2">
                                    • Player Progression System<br />
                                    • Territory Control<br />
                                    • Clan Wars<br />
                                    • Tournament System<br />
                                    • Avatar Progression
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">🤖 AI Systems</Typography>
                                <Typography variant="body2">
                                    • AI Commentary<br />
                                    • Match Analysis<br />
                                    • AI Coaching<br />
                                    • Shot Tracking<br />
                                    • Performance Analytics
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">🏢 Venue Management</Typography>
                                <Typography variant="body2">
                                    • Venue Analytics<br />
                                    • Player Tracking<br />
                                    • Revenue Management<br />
                                    • Tournament Hosting<br />
                                    • Customization Tools
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">💎 Blockchain</Typography>
                                <Typography variant="body2">
                                    • Dojo Coins<br />
                                    • NFT Avatars<br />
                                    • Tournament Trophies<br />
                                    • Cross-chain Support<br />
                                    • Wallet Integration
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

const GameMechanicsPage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
            🎮 Game Mechanics
        </Typography>
        <Typography variant="body1" paragraph>
            Advanced game mechanics and features will be implemented here.
        </Typography>
    </Container>
);

const TournamentPage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
            🏆 Tournaments
        </Typography>
        <Typography variant="body1" paragraph>
            Tournament management and participation features will be implemented here.
        </Typography>
    </Container>
);

const ClanWarsPage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
            ⚔️ Clan Wars
        </Typography>
        <Typography variant="body1" paragraph>
            Clan warfare and territory battles will be implemented here.
        </Typography>
    </Container>
);

const AICommentaryPage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
            🤖 AI Commentary
        </Typography>
        <Typography variant="body1" paragraph>
            AI-powered match commentary and analysis will be implemented here.
        </Typography>
    </Container>
);

// Navigation component
const Navigation = () => (
    <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                DojoPool
            </Typography>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/game-mechanics">Game Mechanics</Button>
            <Button color="inherit" component={Link} to="/tournaments">Tournaments</Button>
            <Button color="inherit" component={Link} to="/clan-wars">Clan Wars</Button>
            <Button color="inherit" component={Link} to="/ai-commentary">AI Commentary</Button>
        </Toolbar>
    </AppBar>
);

// Main App component
const App: React.FC = () => {
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: '#1976d2',
            },
            secondary: {
                main: '#dc004e',
            },
            background: {
                default: '#121212',
                paper: '#1e1e1e',
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Navigation />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/game-mechanics" element={<GameMechanicsPage />} />
                    <Route path="/tournaments" element={<TournamentPage />} />
                    <Route path="/clan-wars" element={<ClanWarsPage />} />
                    <Route path="/ai-commentary" element={<AICommentaryPage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

export default App;