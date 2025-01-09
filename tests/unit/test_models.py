import pytest
from datetime import datetime, timedelta
from dojopool.models.user import User, UserProfile
from dojopool.models.game import Game, GamePlayer
from dojopool.models.tournament import Tournament, TournamentPlayer
from dojopool.models.venue import Venue, VenueManager
from dojopool.extensions import db
from dojopool.exceptions import ModelError

@pytest.fixture
def sample_user():
    return User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password"
    )

@pytest.fixture
def sample_game():
    return Game(
        game_type="8ball",
        status="active",
        created_at=datetime.utcnow()
    )

@pytest.fixture
def sample_tournament():
    return Tournament(
        name="Winter Championship",
        tournament_type="single_elimination",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=2)
    )

class TestModels:
    def test_user_creation(self, sample_user):
        """Test user model creation and validation"""
        assert sample_user.username == "testuser"
        assert sample_user.email == "test@example.com"
        assert sample_user.password_hash is not None
        
        # Test unique constraints
        with pytest.raises(ModelError):
            duplicate_user = User(
                username="testuser",
                email="test@example.com",
                password_hash="different_hash"
            )
            db.session.add(duplicate_user)
            db.session.commit()

    def test_user_profile_relationship(self, sample_user):
        """Test user profile relationship"""
        profile = UserProfile(
            user=sample_user,
            full_name="Test User",
            bio="A pool enthusiast",
            skill_level="intermediate"
        )
        
        db.session.add(profile)
        db.session.commit()
        
        assert sample_user.profile.full_name == "Test User"
        assert sample_user.profile.skill_level == "intermediate"

    def test_game_player_relationship(self, sample_user, sample_game):
        """Test game-player relationship"""
        game_player = GamePlayer(
            user=sample_user,
            game=sample_game,
            role="player",
            score=0
        )
        
        db.session.add(game_player)
        db.session.commit()
        
        assert len(sample_game.players) == 1
        assert sample_game.players[0].user_id == sample_user.id
        assert sample_user.games[0].id == sample_game.id

    def test_tournament_relationships(self, sample_user, sample_tournament):
        """Test tournament relationships"""
        tournament_player = TournamentPlayer(
            user=sample_user,
            tournament=sample_tournament,
            registration_date=datetime.utcnow(),
            seed=1
        )
        
        db.session.add(tournament_player)
        db.session.commit()
        
        assert len(sample_tournament.players) == 1
        assert sample_tournament.players[0].user_id == sample_user.id
        assert sample_user.tournaments[0].id == sample_tournament.id

    def test_venue_management(self, sample_user):
        """Test venue management relationships"""
        venue = Venue(
            name="Downtown Pool Hall",
            address="123 Main St",
            contact_info="555-0123"
        )
        
        venue_manager = VenueManager(
            user=sample_user,
            venue=venue,
            role="manager",
            assigned_date=datetime.utcnow()
        )
        
        db.session.add_all([venue, venue_manager])
        db.session.commit()
        
        assert len(venue.managers) == 1
        assert venue.managers[0].user_id == sample_user.id
        assert sample_user.managed_venues[0].id == venue.id

    def test_cascade_deletion(self, sample_user, sample_game):
        """Test cascade deletion behavior"""
        # Set up relationships
        game_player = GamePlayer(
            user=sample_user,
            game=sample_game,
            role="player"
        )
        
        db.session.add(game_player)
        db.session.commit()
        
        # Delete user and verify cascades
        db.session.delete(sample_user)
        db.session.commit()
        
        assert GamePlayer.query.filter_by(user_id=sample_user.id).first() is None

    def test_model_validation(self):
        """Test model validation rules"""
        # Test invalid email
        with pytest.raises(ModelError):
            User(
                username="testuser",
                email="invalid_email",
                password_hash="hash"
            )
        
        # Test invalid game type
        with pytest.raises(ModelError):
            Game(
                game_type="invalid_type",
                status="active"
            )
        
        # Test invalid tournament dates
        with pytest.raises(ModelError):
            Tournament(
                name="Invalid Tournament",
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() - timedelta(days=1)  # End before start
            )

    def test_model_queries(self, sample_user, sample_game):
        """Test model query methods"""
        # Add some test data
        for i in range(5):
            game = Game(
                game_type="8ball",
                status="completed" if i % 2 == 0 else "active",
                created_at=datetime.utcnow() - timedelta(days=i)
            )
            game_player = GamePlayer(user=sample_user, game=game)
            db.session.add_all([game, game_player])
        
        db.session.commit()
        
        # Test various queries
        active_games = Game.query.filter_by(status="active").all()
        assert len(active_games) == 2
        
        recent_games = Game.query.filter(
            Game.created_at >= datetime.utcnow() - timedelta(days=3)
        ).all()
        assert len(recent_games) == 3
        
        user_games = sample_user.games
        assert len(user_games) == 5

    def test_model_statistics(self, sample_user):
        """Test model statistics methods"""
        # Add test game data
        for i in range(10):
            game = Game(
                game_type="8ball",
                status="completed",
                created_at=datetime.utcnow() - timedelta(days=i)
            )
            game_player = GamePlayer(
                user=sample_user,
                game=game,
                score=i,
                winner=bool(i % 2)
            )
            db.session.add_all([game, game_player])
        
        db.session.commit()
        
        # Calculate statistics
        stats = sample_user.calculate_statistics()
        assert stats["total_games"] == 10
        assert stats["wins"] == 5
        assert stats["average_score"] == 4.5 