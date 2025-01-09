import pytest
from datetime import datetime, timedelta
from dojopool.services.game_state_service import GameStateService
from dojopool.models.game import Game, GameState, GameAction
from dojopool.models.user import User
from dojopool.extensions import db
from dojopool.exceptions import GameStateError

@pytest.fixture
def game_state_service():
    return GameStateService()

@pytest.fixture
def sample_game_state(sample_game):
    return GameState(
        game=sample_game,
        current_player_id=1,
        balls_remaining=[1, 2, 3, 4, 5, 6, 7, 8],
        score={"player1": 0, "player2": 0},
        status="in_progress"
    )

class TestGameState:
    def test_state_initialization(self, game_state_service, sample_game):
        """Test game state initialization"""
        # Initialize game state
        state = game_state_service.initialize_game_state(
            game_id=sample_game.id,
            game_type="8ball"
        )
        
        assert state.game_id == sample_game.id
        assert state.status == "initialized"
        assert len(state.balls_remaining) == 15
        assert state.current_player_id is not None
        
        # Verify initial configuration
        config = game_state_service.get_game_configuration(state.id)
        assert config["game_type"] == "8ball"
        assert "rules" in config
        assert "scoring" in config

    def test_state_transitions(self, game_state_service, sample_game_state):
        """Test game state transitions"""
        # Start game
        started = game_state_service.transition_state(
            state_id=sample_game_state.id,
            action="start_game"
        )
        assert started.status == "in_progress"
        
        # Player turn transition
        next_turn = game_state_service.transition_state(
            state_id=sample_game_state.id,
            action="next_turn"
        )
        assert next_turn.current_player_id != sample_game_state.current_player_id
        
        # Test invalid transition
        with pytest.raises(GameStateError):
            game_state_service.transition_state(
                state_id=sample_game_state.id,
                action="invalid_action"
            )

    def test_action_processing(self, game_state_service, sample_game_state):
        """Test game action processing"""
        # Process shot action
        action = game_state_service.process_action(
            state_id=sample_game_state.id,
            action_type="shot",
            action_data={
                "player_id": sample_game_state.current_player_id,
                "ball_number": 1,
                "pocket": "top_right",
                "is_valid": True
            }
        )
        
        assert action.type == "shot"
        assert action.is_valid is True
        assert action.processed_at is not None
        
        # Verify state update
        updated_state = game_state_service.get_state(sample_game_state.id)
        assert 1 not in updated_state.balls_remaining
        assert updated_state.score["player1"] > 0 or updated_state.score["player2"] > 0

    def test_validation_rules(self, game_state_service, sample_game_state):
        """Test game state validation rules"""
        # Test valid action
        validation = game_state_service.validate_action(
            state_id=sample_game_state.id,
            action_type="shot",
            action_data={
                "player_id": sample_game_state.current_player_id,
                "ball_number": 1
            }
        )
        assert validation["is_valid"] is True
        
        # Test invalid player
        validation = game_state_service.validate_action(
            state_id=sample_game_state.id,
            action_type="shot",
            action_data={
                "player_id": 999,  # Invalid player
                "ball_number": 1
            }
        )
        assert validation["is_valid"] is False
        assert "invalid_player" in validation["errors"]

    def test_scoring_mechanics(self, game_state_service, sample_game_state):
        """Test scoring mechanics"""
        # Process successful shot
        game_state_service.process_action(
            state_id=sample_game_state.id,
            action_type="shot",
            action_data={
                "player_id": sample_game_state.current_player_id,
                "ball_number": 1,
                "is_valid": True
            }
        )
        
        # Verify score update
        state = game_state_service.get_state(sample_game_state.id)
        assert sum(state.score.values()) > 0
        
        # Test score calculation
        score_details = game_state_service.calculate_score(
            state_id=sample_game_state.id
        )
        assert "current_frame" in score_details
        assert "total_score" in score_details

    def test_game_completion(self, game_state_service, sample_game_state):
        """Test game completion logic"""
        # Simulate game completion
        game_state_service.process_action(
            state_id=sample_game_state.id,
            action_type="win_condition",
            action_data={
                "player_id": sample_game_state.current_player_id,
                "reason": "8_ball_potted"
            }
        )
        
        # Verify game completion
        completed_state = game_state_service.get_state(sample_game_state.id)
        assert completed_state.status == "completed"
        assert completed_state.winner_id is not None
        
        # Test completion summary
        summary = game_state_service.generate_game_summary(
            state_id=sample_game_state.id
        )
        assert "winner" in summary
        assert "final_score" in summary
        assert "duration" in summary

    def test_state_persistence(self, game_state_service, sample_game_state):
        """Test game state persistence"""
        # Save state snapshot
        snapshot = game_state_service.save_state_snapshot(
            state_id=sample_game_state.id
        )
        assert snapshot["version"] > 0
        
        # Restore from snapshot
        restored = game_state_service.restore_state_snapshot(
            state_id=sample_game_state.id,
            snapshot_version=snapshot["version"]
        )
        assert restored.balls_remaining == sample_game_state.balls_remaining
        assert restored.score == sample_game_state.score

    def test_state_history(self, game_state_service, sample_game_state):
        """Test game state history tracking"""
        # Record actions
        for i in range(3):
            game_state_service.process_action(
                state_id=sample_game_state.id,
                action_type="shot",
                action_data={
                    "player_id": sample_game_state.current_player_id,
                    "ball_number": i + 1,
                    "is_valid": True
                }
            )
        
        # Get action history
        history = game_state_service.get_action_history(
            state_id=sample_game_state.id
        )
        assert len(history) == 3
        assert all(action.type == "shot" for action in history)
        
        # Test state replay
        replay = game_state_service.replay_game_state(
            state_id=sample_game_state.id,
            action_index=1
        )
        assert len(replay.balls_remaining) > len(sample_game_state.balls_remaining)

    def test_error_handling(self, game_state_service, sample_game_state):
        """Test error handling in game state management"""
        # Test invalid ball number
        with pytest.raises(GameStateError):
            game_state_service.process_action(
                state_id=sample_game_state.id,
                action_type="shot",
                action_data={
                    "player_id": sample_game_state.current_player_id,
                    "ball_number": 99  # Invalid ball number
                }
            )
        
        # Test out of turn action
        with pytest.raises(GameStateError):
            game_state_service.process_action(
                state_id=sample_game_state.id,
                action_type="shot",
                action_data={
                    "player_id": sample_game_state.current_player_id + 1,  # Wrong player
                    "ball_number": 1
                }
            )

    def test_statistics_tracking(self, game_state_service, sample_game_state):
        """Test game statistics tracking"""
        # Record some actions
        for _ in range(5):
            game_state_service.process_action(
                state_id=sample_game_state.id,
                action_type="shot",
                action_data={
                    "player_id": sample_game_state.current_player_id,
                    "ball_number": 1,
                    "is_valid": True
                }
            )
        
        # Get game statistics
        stats = game_state_service.get_game_statistics(
            state_id=sample_game_state.id
        )
        
        assert "total_shots" in stats
        assert "accuracy" in stats
        assert "average_turn_duration" in stats
        assert "fouls" in stats 