"""Test factories for creating test data."""
from datetime import datetime, timedelta
from src.models import (
    User, Game, Tournament, Venue, Role, Location, Match,
    Achievement, Rating, Leaderboard, Review, Notification,
    Session, Token
)

class TestData:
    """Container for test data."""
    
    def __init__(self):
        """Initialize test data container."""
        self.users = []
        self.games = []
        self.tournaments = []
        self.venues = []
        self.roles = []
        self.locations = []
        self.matches = []
        self.sessions = []

class UserFactory:
    """Factory for creating test users."""
    
    @staticmethod
    def create(username: str, email: str, role_name: str = 'user') -> User:
        """Create a test user.
        
        Args:
            username: Username
            email: Email address
            role_name: Role name (default: 'user')
            
        Returns:
            User: Created user
        """
        user = User(
            username=username,
            email=email,
            password='password123',
            is_active=True
        )
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user.roles.append(role)
        user.save()
        return user

class GameFactory:
    """Factory for creating test games."""
    
    @staticmethod
    def create(player1: User, player2: User, venue: Venue, match: Match) -> Game:
        """Create a test game.
        
        Args:
            player1: First player
            player2: Second player
            venue: Game venue
            match: Parent match
            
        Returns:
            Game: Created game
        """
        game = Game(
            player1=player1,
            player2=player2,
            venue=venue,
            match=match,
            status='completed',
            winner=player1,
            score='8-5'
        )
        game.save()
        return game

class TournamentFactory:
    """Factory for creating test tournaments."""
    
    @staticmethod
    def create(organizer: User, venue: Venue) -> Tournament:
        """Create a test tournament.
        
        Args:
            organizer: Tournament organizer
            venue: Tournament venue
            
        Returns:
            Tournament: Created tournament
        """
        tournament = Tournament(
            name='Test Tournament',
            organizer=organizer,
            venue=venue,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=1),
            status='active',
            prize_pool=1000
        )
        tournament.save()
        return tournament

class VenueFactory:
    """Factory for creating test venues."""
    
    @staticmethod
    def create(owner: User, location: Location) -> Venue:
        """Create a test venue.
        
        Args:
            owner: Venue owner
            location: Venue location
            
        Returns:
            Venue: Created venue
        """
        venue = Venue(
            name='Test Venue',
            owner=owner,
            location=location,
            description='Test venue description',
            status='active',
            capacity=100
        )
        venue.save()
        return venue

class RoleFactory:
    """Factory for creating test roles."""
    
    @staticmethod
    def create(name: str, description: str = None) -> Role:
        """Create a test role.
        
        Args:
            name: Role name
            description: Role description
            
        Returns:
            Role: Created role
        """
        role = Role(
            name=name,
            description=description or f'{name} role'
        )
        role.save()
        return role

class LocationFactory:
    """Factory for creating test locations."""
    
    @staticmethod
    def create() -> Location:
        """Create a test location.
        
        Returns:
            Location: Created location
        """
        location = Location(
            address='123 Test St',
            city='Test City',
            state='Test State',
            country='Test Country',
            postal_code='12345',
            latitude=0.0,
            longitude=0.0
        )
        location.save()
        return location

class MatchFactory:
    """Factory for creating test matches."""
    
    @staticmethod
    def create(player1: User, player2: User, venue: Venue) -> Match:
        """Create a test match.
        
        Args:
            player1: First player
            player2: Second player
            venue: Match venue
            
        Returns:
            Match: Created match
        """
        match = Match(
            player1=player1,
            player2=player2,
            venue=venue,
            status='completed',
            winner=player1,
            score='8-5'
        )
        match.save()
        return match

class SessionFactory:
    """Factory for creating test sessions."""
    
    @staticmethod
    def create(user: User) -> Session:
        """Create a test session.
        
        Args:
            user: Session user
            
        Returns:
            Session: Created session
        """
        session = Session(
            user=user,
            token='test-session-token',
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        session.save()
        return session