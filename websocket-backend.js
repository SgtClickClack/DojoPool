const http = require('http');
const url = require('url');

const PORT = 8080;

// Game state management
const activeGames = new Map();
const activeTournaments = new Map();
const connectedPlayers = new Map();
const eventListeners = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const path = url.parse(req.url).pathname;

    if (path === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            stats: {
                activeConnections: connectedPlayers.size,
                totalGames: activeGames.size,
                totalTournaments: activeTournaments.size
            },
            environment: 'development',
            features: ['realTime', 'multiplayer', 'tournaments', 'clanWars', 'aiCommentary']
        }));
    } else if (path === '/api/game-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            player: {
                level: 15,
                xp: 2840,
                clan: 'Crimson Monkey',
                achievements: 23,
                territory: {
                    owned: 5,
                    total: 12,
                    currentObjective: 'Defend Jade Tiger Dojo'
                }
            },
            activeGames: Array.from(activeGames.values()),
            activeTournaments: Array.from(activeTournaments.values()),
            onlinePlayers: connectedPlayers.size
        }));
    } else if (path === '/api/tournaments') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            tournaments: Array.from(activeTournaments.values()),
            upcoming: [
                { id: 't1', name: 'Summer Championship', startTime: '2025-07-25T18:00:00Z', participants: 24 },
                { id: 't2', name: 'Clan Wars Finals', startTime: '2025-07-26T20:00:00Z', participants: 16 }
            ]
        }));
    } else if (path === '/api/clan-wars') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            activeWars: [
                { id: 'cw1', clan1: 'Crimson Monkey', clan2: 'Azure Dragon', score: '3-2', territory: 'Jade Tiger' },
                { id: 'cw2', clan1: 'Golden Phoenix', clan2: 'Silver Wolf', score: '1-4', territory: 'Iron Fist' }
            ],
            leaderboard: [
                { clan: 'Crimson Monkey', territory: 8, members: 24, rating: 1850 },
                { clan: 'Azure Dragon', territory: 6, members: 18, rating: 1720 },
                { clan: 'Golden Phoenix', territory: 4, members: 15, rating: 1680 }
            ]
        }));
    } else if (path === '/api/ai-commentary') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            currentMatch: {
                id: 'm1',
                player1: 'RyuKlaw',
                player2: 'ShadowStrike',
                venue: 'Jade Tiger Dojo',
                commentary: [
                    { time: '00:15', text: 'RyuKlaw sets up for a classic corner shot...', type: 'play' },
                    { time: '00:23', text: 'The AI Umpire approves the shot angle!', type: 'referee' },
                    { time: '00:31', text: 'What a spectacular bank shot! The Pool Gods are impressed!', type: 'commentary' }
                ]
            },
            recentHighlights: [
                { id: 'h1', title: 'Impossible Trick Shot', player: 'RyuKlaw', venue: 'Jade Tiger', timestamp: '2025-07-22T21:15:00Z' },
                { id: 'h2', title: 'Clan War Victory', clan: 'Crimson Monkey', venue: 'Iron Fist', timestamp: '2025-07-22T20:30:00Z' }
            ]
        }));
    } else if (path === '/api/events') {
        // Server-Sent Events endpoint for real-time updates
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const player = { id: playerId, name: `Player_${playerId.slice(-4)}`, clan: 'Crimson Monkey' };

        connectedPlayers.set(playerId, player);
        eventListeners.set(playerId, res);

        console.log(`🎮 Player connected: ${playerId}`);

        // Send initial connection event
        res.write(`data: ${JSON.stringify({
            type: 'connection',
            playerId: playerId,
            gameState: {
                activeGames: Array.from(activeGames.values()),
                activeTournaments: Array.from(activeTournaments.values()),
                onlinePlayers: connectedPlayers.size
            }
        })}\n\n`);

        // Broadcast player joined
        broadcastToAll({
            type: 'playerJoined',
            player: player,
            onlinePlayers: connectedPlayers.size
        });

        // Keep connection alive
        const keepAlive = setInterval(() => {
            res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
        }, 30000);

        req.on('close', () => {
            clearInterval(keepAlive);
            connectedPlayers.delete(playerId);
            eventListeners.delete(playerId);
            console.log(`👋 Player disconnected: ${playerId}`);

            // Broadcast player left
            broadcastToAll({
                type: 'playerLeft',
                player: player,
                onlinePlayers: connectedPlayers.size
            });
        });
    } else if (path === '/api/action' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                handleAction(data, res);
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

function handleAction(data, res) {
    const { type, playerId, ...actionData } = data;
    const player = connectedPlayers.get(playerId);

    switch (type) {
        case 'joinGame':
            handleJoinGame(playerId, actionData, player);
            break;
        case 'makeMove':
            handleMakeMove(playerId, actionData, player);
            break;
        case 'sendChat':
            handleSendChat(playerId, actionData, player);
            break;
        case 'joinTournament':
            handleJoinTournament(playerId, actionData, player);
            break;
        case 'updateAvatar':
            handleUpdateAvatar(playerId, actionData, player);
            break;
        default:
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown action type' }));
            return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
}

function handleJoinGame(playerId, data, player) {
    const gameId = data.gameId || `game_${Date.now()}`;

    if (!activeGames.has(gameId)) {
        activeGames.set(gameId, {
            id: gameId,
            players: [],
            status: 'waiting',
            startTime: null,
            moves: []
        });
    }

    const game = activeGames.get(gameId);
    game.players.push(player);

    if (game.players.length >= 2) {
        game.status = 'active';
        game.startTime = new Date().toISOString();
    }

    // Notify all players in the game
    broadcastToGame(gameId, {
        type: 'gameUpdate',
        game: game
    });

    console.log(`🎱 Player ${player.name} joined game ${gameId}`);
}

function handleMakeMove(playerId, data, player) {
    const game = activeGames.get(data.gameId);
    if (!game) return;

    const move = {
        player: player,
        shot: data.shot,
        timestamp: new Date().toISOString(),
        result: data.result
    };

    game.moves.push(move);

    // Broadcast move to all players in the game
    broadcastToGame(data.gameId, {
        type: 'moveMade',
        move: move,
        game: game
    });

    // Generate AI commentary
    const commentary = generateAICommentary(move, game);
    if (commentary) {
        broadcastToGame(data.gameId, {
            type: 'aiCommentary',
            commentary: commentary
        });
    }

    console.log(`🎯 Move made by ${player.name} in game ${data.gameId}`);
}

function handleSendChat(playerId, data, player) {
    const message = {
        id: `msg_${Date.now()}`,
        player: player,
        text: data.text,
        timestamp: new Date().toISOString(),
        type: data.chatType || 'general'
    };

    // Broadcast chat message
    broadcastToAll({
        type: 'chatMessage',
        message: message
    });

    console.log(`💬 Chat from ${player.name}: ${data.text}`);
}

function handleJoinTournament(playerId, data, player) {
    const tournamentId = data.tournamentId;

    if (!activeTournaments.has(tournamentId)) {
        activeTournaments.set(tournamentId, {
            id: tournamentId,
            name: data.tournamentName || 'Quick Tournament',
            players: [],
            status: 'registration',
            startTime: new Date(Date.now() + 60000).toISOString() // Start in 1 minute
        });
    }

    const tournament = activeTournaments.get(tournamentId);
    tournament.players.push(player);

    // Broadcast tournament update
    broadcastToAll({
        type: 'tournamentUpdate',
        tournament: tournament
    });

    console.log(`🏆 Player ${player.name} joined tournament ${tournamentId}`);
}

function handleUpdateAvatar(playerId, data, player) {
    player.avatar = data.avatar;
    player.level = data.level || player.level;
    player.xp = data.xp || player.xp;

    // Broadcast avatar update
    broadcastToAll({
        type: 'avatarUpdate',
        player: player
    });

    console.log(`👤 Avatar updated for ${player.name}`);
}

function generateAICommentary(move, game) {
    const commentaries = [
        "The AI Umpire approves this shot angle!",
        "What a spectacular bank shot! The Pool Gods are impressed!",
        "The Match Commentator is calling this the shot of the century!",
        "The God of Luck smiles upon this player!",
        "A masterful display of precision and timing!",
        "The crowd goes wild as the ball finds its mark!"
    ];

    if (Math.random() < 0.3) { // 30% chance of commentary
        return {
            text: commentaries[Math.floor(Math.random() * commentaries.length)],
            type: 'commentary',
            timestamp: new Date().toISOString()
        };
    }

    return null;
}

function broadcastToAll(message) {
    eventListeners.forEach((res, playerId) => {
        res.write(`data: ${JSON.stringify(message)}\n\n`);
    });
}

function broadcastToGame(gameId, message) {
    const game = activeGames.get(gameId);
    if (!game) return;

    eventListeners.forEach((res, playerId) => {
        const player = connectedPlayers.get(playerId);
        if (game.players.some(p => p.id === player?.id)) {
            res.write(`data: ${JSON.stringify(message)}\n\n`);
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 DojoPool Real-Time Backend running on http://localhost:${PORT}`);
    console.log(`📡 Server-Sent Events: http://localhost:${PORT}/api/events`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎮 Game status: http://localhost:${PORT}/api/game-status`);
    console.log(`🏆 Tournaments: http://localhost:${PORT}/api/tournaments`);
    console.log(`⚔️ Clan Wars: http://localhost:${PORT}/api/clan-wars`);
    console.log(`🤖 AI Commentary: http://localhost:${PORT}/api/ai-commentary`);
    console.log(`🔧 Environment: development`);
    console.log(`⚙️ Features: realTime, multiplayer, tournaments, clanWars, aiCommentary`);
});

console.log(`🎱 DojoPool Real-Time Backend starting...`);
console.log(`📡 Real-time multiplayer features enabled`);
console.log(`🤖 AI commentary system active`);
console.log(`🏆 Tournament system ready`);
console.log(`⚔️ Clan wars system operational`);
console.log(`⚔️ Clan wars system operational`);