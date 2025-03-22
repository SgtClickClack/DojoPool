# Pool Game Components

This directory contains the core components for the pool game interface.

## Components

### GameBoard
The main game board component that renders the pool table and balls using Konva.js.

```tsx
<GameBoard
  width={800}
  height={400}
  balls={balls}
  onBallClick={handleBallClick}
  onTableClick={handleTableClick}
  isInteractive={true}
/>
```

Features:
- Real-time ball rendering
- Interactive ball selection
- Click-based shot targeting
- Responsive canvas sizing
- Theme-aware styling

### GameControls
Controls for shot mechanics including power, angle, and spin.

```tsx
<GameControls
  onShot={handleShot}
  isActive={true}
  maxPower={100}
  onCancel={handleCancel}
/>
```

Features:
- Power charging mechanism
- Angle selection
- Spin control
- Shot execution
- Cancel functionality

### GamePlay
The main game component that integrates the board and controls with game logic.

```tsx
<GamePlay
  gameId="game-123"
  isSpectator={false}
  onGameEnd={handleGameEnd}
/>
```

Features:
- Real-time game state management
- WebSocket integration
- Player turn handling
- Spectator mode
- Game status updates

## Game State

The game state is managed through a WebSocket connection and includes:

```typescript
interface GameState {
  balls: Ball[];
  currentPlayer: number;
  gameStatus: 'waiting' | 'in_progress' | 'finished';
  winner?: number;
}
```

## Shot Mechanics

Shots are executed with the following parameters:
- `power`: Shot power (0-100)
- `angle`: Shot angle in degrees (0-360)
- `spin`: Ball spin (-100 to 100)

## Testing

Run tests for the game components:

```bash
npm test src/components/game/__tests__/GamePlay.test.tsx
```

## Styling

The components use Chakra UI for styling and support both light and dark themes. Colors are automatically adjusted based on the current theme.

## Performance Considerations

1. Canvas Rendering
   - Uses Konva.js for efficient canvas rendering
   - Implements layer-based rendering for better performance
   - Optimizes re-renders using React's state management

2. WebSocket Updates
   - Batches state updates to minimize re-renders
   - Implements connection error handling
   - Provides automatic reconnection

3. Event Handling
   - Debounces user input for smoother performance
   - Implements efficient click detection
   - Uses requestAnimationFrame for animations

## Usage Example

```tsx
import { GamePlay } from './components/game/GamePlay';

function PoolGame() {
  const handleGameEnd = (winner: number) => {
    console.log(`Player ${winner} wins!`);
  };

  return (
    <GamePlay
      gameId="game-123"
      isSpectator={false}
      onGameEnd={handleGameEnd}
    />
  );
} 