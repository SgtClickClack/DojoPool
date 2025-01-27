/**
 * Example usage of the WebSocket manager.
 */

import { socketManager } from './socket_manager';

// Connect to the server
socketManager.connect().then(() => {
    console.log('Connected to game server');

    // Subscribe to game events
    socketManager.subscribe('game_state', (state) => {
        console.log('Game state updated:', state);
    });

    socketManager.subscribe('error', (error) => {
        console.error('Game error:', error);
    });

    // Join a game room
    const gameId = '123';
    socketManager.send('join_room', {
        room: `game_${gameId}`
    });

    // Send a shot
    socketManager.send('shot', {
        power: 0.8,
        angle: 45.0,
        playerId: 1,
        gameId: gameId,
        shotType: 'normal'
    });

}).catch((error) => {
    console.error('Failed to connect:', error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    socketManager.disconnect();
}); 