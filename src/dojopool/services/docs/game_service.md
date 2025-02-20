# Game Service Documentation

## Overview
The GameService manages game-related operations in DojoPool, including game creation, score tracking, and game state management.

## Service Interface

### Methods

#### `create_game(venue_id: int, player_ids: List[int], game_type: str = "8ball", is_ranked: bool = True) -> Dict[str, Any]`
Creates a new game with the specified players at a venue.

**Parameters:**
- `venue_id`: ID of the venue where the game is taking place
- `player_ids`: List of player IDs (1-2 players)
- `game_type`: Type of game (8ball, 9ball, etc.)
- `is_ranked`: Whether the game affects player rankings

**Returns:**
Dictionary containing game information including ID, players, status, etc.

**Raises:**
- `ValueError`: If players not found or invalid game configuration
- `NotFound`: If venue doesn't exist

**Example:**
```python
game = game_service.create_game(
    venue_id=1,
    player_ids=[1, 2],
    game_type="8ball",
    is_ranked=True
)
```

#### `get_game(game_id: int) -> Optional[Dict[str, Any]]`
Retrieves game information by ID.

**Parameters:**
- `game_id`: ID of the game to retrieve

**Returns:**
Dictionary containing game information if found, None otherwise

**Example:**
```python
game = game_service.get_game(1)
if game:
    print(f"Game status: {game['status']}")
```

#### `update_score(game_id: int, player_id: int, points: int) -> Dict[str, Any]`
Updates the score for a player in a game.

**Parameters:**
- `game_id`: Game ID
- `player_id`: Player ID
- `points`: Points to add

**Returns:**
Updated game information

**Raises:**
- `ValueError`: If player not in game
- `NotFound`: If game doesn't exist

**Example:**
```python
game = game_service.update_score(1, player_id=1, points=1)
```

#### `end_game(game_id: int, winner_id: int) -> Dict[str, Any]`
Ends a game and records the winner.

**Parameters:**
- `game_id`: Game ID
- `winner_id`: Winner's user ID

**Returns:**
Final game information

**Raises:**
- `ValueError`: If winner not in game
- `NotFound`: If game doesn't exist

**Example:**
```python
game = game_service.end_game(1, winner_id=1)
```

## Dependencies
- Models:
  - `Game`
  - `GameSession`
  - `Shot`
  - `User`
  - `Venue`
- Extensions:
  - `SQLAlchemy (db)`

## Configuration
No specific configuration required. Uses database configuration from Flask app.

## Error Handling
- Uses HTTP 404 for not found resources
- Raises ValueError for validation errors
- Returns None for non-existent games in get_game
- All database operations wrapped in transactions

## Performance Considerations
- Uses SQLAlchemy query optimization
- Implements proper indexing on game tables
- Minimizes database queries
- Uses eager loading for relationships when needed

## Security Considerations
- Validates user permissions
- Ensures users can only access their own games
- Validates input data
- Uses parameterized queries
- Implements proper access control

## Testing
Test cases should cover:
- Game creation with various configurations
- Score updates
- Game completion
- Error cases
- Permission checks
- Edge cases (single player, invalid inputs)

## Examples

### Complete Game Flow
```python
# Create a game
game = game_service.create_game(
    venue_id=1,
    player_ids=[1, 2],
    game_type="8ball",
    is_ranked=True
)

# Update scores
game = game_service.update_score(game['id'], player_id=1, points=1)
game = game_service.update_score(game['id'], player_id=2, points=1)

# End game
final_game = game_service.end_game(game['id'], winner_id=1)
```

### Error Handling
```python
try:
    game = game_service.create_game(venue_id=1, player_ids=[999])
except ValueError as e:
    print(f"Invalid game configuration: {e}")
except NotFound as e:
    print(f"Resource not found: {e}") 