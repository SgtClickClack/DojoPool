/**
 * WebSocket integration for real-time game tracking
 */

class GameSocket {
  constructor(gameId) {
    this.socket = io();
    this.gameId = gameId;
    this.connected = false;
    this.eventHandlers = new Map();

    this.initializeSocket();
  }

  initializeSocket() {
    // Connection events
    this.socket.on("connect", () => {
      this.connected = true;
      this.emit("join_game", { game_id: this.gameId });
      this.triggerHandler("connect");
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      this.triggerHandler("disconnect");
    });

    // Game events
    this.socket.on("game_state", (data) => {
      this.triggerHandler("gameState", data);
    });

    this.socket.on("shot_result", (data) => {
      this.triggerHandler("shotResult", data);
    });

    this.socket.on("pocket_result", (data) => {
      this.triggerHandler("pocketResult", data);
    });

    this.socket.on("break_result", (data) => {
      this.triggerHandler("breakResult", data);
    });

    this.socket.on("safety_result", (data) => {
      this.triggerHandler("safetyResult", data);
    });

    this.socket.on("foul_result", (data) => {
      this.triggerHandler("foulResult", data);
    });

    this.socket.on("game_completed", (data) => {
      this.triggerHandler("gameCompleted", data);
    });

    this.socket.on("error", (data) => {
      this.triggerHandler("error", data);
    });
  }

  // Event handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  triggerHandler(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach((handler) => handler(data));
    }
  }

  // Game actions
  takeShot(shotData) {
    this.socket.emit("shot_taken", {
      game_id: this.gameId,
      shot_data: shotData,
    });
  }

  declarePocket(ballData) {
    this.socket.emit("ball_pocketed", {
      game_id: this.gameId,
      ball_data: ballData,
    });
  }

  takeBreak(breakData) {
    this.socket.emit("break_shot", {
      game_id: this.gameId,
      break_data: breakData,
    });
  }

  declareSafety(safetyData) {
    this.socket.emit("safety_declared", {
      game_id: this.gameId,
      safety_data: safetyData,
    });
  }

  callFoul(foulData) {
    this.socket.emit("foul_called", {
      game_id: this.gameId,
      foul_data: foulData,
    });
  }

  requestGameState() {
    this.socket.emit("request_game_state", {
      game_id: this.gameId,
    });
  }

  disconnect() {
    if (this.connected) {
      this.socket.emit("leave_game", { game_id: this.gameId });
      this.socket.disconnect();
    }
  }
}

// Example usage:
/*
const gameSocket = new GameSocket(gameId);

gameSocket.on('connect', () => {
    console.log('Connected to game server');
});

gameSocket.on('shotResult', (data) => {
    console.log('Shot result:', data);
    updateGameDisplay(data.game);
});

gameSocket.on('gameCompleted', (data) => {
    console.log('Game completed:', data);
    showGameSummary(data);
});

// Taking a shot
gameSocket.takeShot({
    power: 0.8,
    angle: 45,
    spin: 0.2,
    english: -0.1
});
*/

export default GameSocket;
