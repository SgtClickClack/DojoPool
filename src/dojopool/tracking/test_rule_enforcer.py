"""Tests for pool game rule enforcement system."""

import pytest
from datetime import datetime, timedelta
from .rule_enforcer import GameType, FoulType, GameState, RuleViolation, RuleEnforcer
from .game_tracker import Shot, BallPosition


@pytest.fixture
def sample_shot() -> Shot:
    """Create a sample shot."""
    now = datetime.now()
    return Shot(
        shot_id="test_shot",
        start_time=now,
        end_time=now + timedelta(seconds=1),
        ball_positions=[
            BallPosition(0, 0.5, 0.5, 0.9, now),  # Cue ball
            BallPosition(1, 1.0, 0.5, 0.9, now),  # Target ball
        ],
        is_valid=True,
        type="normal",
        pocketed_balls=set(),
        foul_detected=False,
        confidence=0.9,
    )


@pytest.fixture
def eight_ball_enforcer() -> RuleEnforcer:
    """Create an 8-ball rule enforcer."""
    return RuleEnforcer(GameType.EIGHT_BALL)


@pytest.fixture
def nine_ball_enforcer() -> RuleEnforcer:
    """Create a 9-ball rule enforcer."""
    return RuleEnforcer(GameType.NINE_BALL)


class TestRuleEnforcer:
    """Test cases for RuleEnforcer."""

    def test_initial_state_eight_ball(self, eight_ball_enforcer: RuleEnforcer) -> None:
        """Test initial state for 8-ball game."""
        state = eight_ball_enforcer.get_state()

        assert state.game_type == GameType.EIGHT_BALL
        assert state.current_player == 1
        assert not state.player_groups  # Empty until break
        assert len(state.remaining_balls[1]) == 7  # Solids
        assert len(state.remaining_balls[2]) == 7  # Stripes
        assert state.is_open_table
        assert state.winner is None

    def test_initial_state_nine_ball(self, nine_ball_enforcer: RuleEnforcer) -> None:
        """Test initial state for 9-ball game."""
        state = nine_ball_enforcer.get_state()

        assert state.game_type == GameType.NINE_BALL
        assert state.current_player == 1
        assert state.on_ball == 1  # Must hit 1 ball first
        assert not state.is_open_table
        assert state.winner is None

    def test_rail_contact_violation(
        self, eight_ball_enforcer: RuleEnforcer, sample_shot: Shot
    ) -> None:
        """Test rail contact rule violation."""
        # Modify shot to have no rail contact
        shot = Shot(
            **{
                **sample_shot.__dict__,
                "ball_positions": [
                    BallPosition(0, 1.0, 1.0, 0.9, datetime.now()),  # Center of table
                    BallPosition(1, 1.2, 1.0, 0.9, datetime.now()),  # Also center
                ],
            }
        )

        violations = eight_ball_enforcer.process_shot(shot)
        assert any(v.foul_type == FoulType.NO_RAIL for v in violations)

    def test_wrong_ball_first_violation(
        self, nine_ball_enforcer: RuleEnforcer, sample_shot: Shot
    ) -> None:
        """Test wrong ball first violation in 9-ball."""
        # Modify shot to hit wrong ball first
        shot = Shot(
            **{
                **sample_shot.__dict__,
                "ball_positions": [
                    BallPosition(0, 0.5, 0.5, 0.9, datetime.now()),  # Cue ball
                    BallPosition(2, 1.0, 0.5, 0.9, datetime.now()),  # Hit 2 ball instead of 1
                ],
            }
        )

        violations = nine_ball_enforcer.process_shot(shot)
        assert any(v.foul_type == FoulType.WRONG_BALL_FIRST for v in violations)

    def test_scratch_violation(self, eight_ball_enforcer: RuleEnforcer, sample_shot: Shot) -> None:
        """Test scratch (pocketed cue ball) violation."""
        # Modify shot to include pocketed cue ball
        shot = Shot(**{**sample_shot.__dict__, "pocketed_balls": {0}})  # Cue ball pocketed

        violations = eight_ball_enforcer.process_shot(shot)
        assert any(v.foul_type == FoulType.SCRATCH for v in violations)

    def test_eight_ball_win_condition(self, eight_ball_enforcer: RuleEnforcer) -> None:
        """Test winning condition in 8-ball."""
        # Set up near-win state
        state = eight_ball_enforcer.get_state()
        state.player_groups[1] = "solids"
        state.player_groups[2] = "stripes"
        state.remaining_balls[1] = {8}  # Only 8 ball left
        state.is_open_table = False

        # Create winning shot
        shot = Shot(**{**sample_shot.__dict__, "pocketed_balls": {8}})  # Pocket 8 ball

        eight_ball_enforcer.process_shot(shot)
        assert eight_ball_enforcer.get_state().winner == 1

    def test_nine_ball_win_condition(self, nine_ball_enforcer: RuleEnforcer) -> None:
        """Test winning condition in 9-ball."""
        # Create winning shot
        shot = Shot(**{**sample_shot.__dict__, "pocketed_balls": {9}})  # Pocket 9 ball

        nine_ball_enforcer.process_shot(shot)
        assert nine_ball_enforcer.get_state().winner == 1

    def test_player_switching(self, eight_ball_enforcer: RuleEnforcer) -> None:
        """Test player switching."""
        initial_player = eight_ball_enforcer.get_state().current_player
        eight_ball_enforcer.switch_player()
        new_player = eight_ball_enforcer.get_state().current_player

        assert initial_player != new_player
        assert new_player in {1, 2}

    def test_eight_ball_group_assignment(
        self, eight_ball_enforcer: RuleEnforcer, sample_shot: Shot
    ) -> None:
        """Test group assignment after first pocket in 8-ball."""
        # Create shot that pockets a solid
        shot = Shot(**{**sample_shot.__dict__, "pocketed_balls": {1}})  # Pocket a solid

        eight_ball_enforcer.process_shot(shot)
        state = eight_ball_enforcer.get_state()

        assert state.player_groups[1] == "solids"
        assert state.player_groups[2] == "stripes"
        assert not state.is_open_table

    def test_nine_ball_progression(
        self, nine_ball_enforcer: RuleEnforcer, sample_shot: Shot
    ) -> None:
        """Test ball progression in 9-ball."""
        # Create shot that pockets ball 1
        shot = Shot(**{**sample_shot.__dict__, "pocketed_balls": {1}})  # Pocket ball 1

        nine_ball_enforcer.process_shot(shot)
        state = nine_ball_enforcer.get_state()

        assert state.on_ball == 2  # Next ball should be 2
        assert 1 not in state.remaining_balls[1]
        assert 1 not in state.remaining_balls[2]

    def test_reset(self, eight_ball_enforcer: RuleEnforcer) -> None:
        """Test game reset."""
        # Make some changes to state
        state = eight_ball_enforcer.get_state()
        state.current_player = 2
        state.player_groups[1] = "solids"
        state.is_open_table = False

        # Reset game
        eight_ball_enforcer.reset()
        new_state = eight_ball_enforcer.get_state()

        assert new_state.current_player == 1
        assert not new_state.player_groups
        assert new_state.is_open_table
        assert not eight_ball_enforcer.get_violations()
