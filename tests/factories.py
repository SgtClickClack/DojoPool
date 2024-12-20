"""Test factories for creating test data."""
from datetime import datetime, timedelta
from src.models import (
    User, Game, Tournament, Venue, Role, Location, Match,
    Session, Token
)
from src.core.database import db

class UserFactory:
    """Factory for creating test users."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test user."""
        # Get or create the default user role
        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            user_role = Role(name='user', description='Regular user role')
            db.session.add(user_role)
            db.session.commit()
        
        # Create user with default values
        user = User(
            username=kwargs.get('username', f'testuser_{datetime.utcnow().timestamp()}'),
            email=kwargs.get('email', f'test_{datetime.utcnow().timestamp()}@example.com'),
            email_verified=kwargs.get('email_verified', True),
            first_name=kwargs.get('first_name', 'Test'),
            last_name=kwargs.get('last_name', 'User'),
            phone=kwargs.get('phone', '+1234567890'),
            avatar=kwargs.get('avatar', None),
            bio=kwargs.get('bio', 'Test user bio'),
            status=kwargs.get('status', 'active'),
            phone_verified=kwargs.get('phone_verified', False),
            last_login=kwargs.get('last_login', datetime.utcnow()),
            last_active=kwargs.get('last_active', datetime.utcnow()),
            preferences=kwargs.get('preferences', {}),
            settings=kwargs.get('settings', {})
        )
        
        # Set password if provided
        if 'password' in kwargs:
            user.set_password(kwargs['password'])
        else:
            user.set_password('password123')
        
        # Add default user role if no roles specified
        if 'roles' not in kwargs:
            user.roles.append(user_role)
        else:
            user.roles.extend(kwargs['roles'])
        
        return user

    def __call__(self, **kwargs):
        """Create and return a test user."""
        user = self.create(**kwargs)
        db.session.add(user)
        db.session.commit()
        return user

class RoleFactory:
    """Factory for creating test roles."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test role."""
        role = Role(
            name=kwargs.get('name', f'role_{datetime.utcnow().timestamp()}'),
            description=kwargs.get('description', 'Test role description'),
            permissions=kwargs.get('permissions', ['read', 'write'])
        )
        return role

    def __call__(self, **kwargs):
        """Create and return a test role."""
        role = self.create(**kwargs)
        db.session.add(role)
        db.session.commit()
        return role

class LocationFactory:
    """Factory for creating test locations."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test location."""
        location = Location(
            name=kwargs.get('name', f'Test Location {datetime.utcnow().timestamp()}'),
            address=kwargs.get('address', '123 Test St'),
            city=kwargs.get('city', 'Test City'),
            state=kwargs.get('state', 'TS'),
            country=kwargs.get('country', 'Test Country'),
            latitude=kwargs.get('latitude', 0.0),
            longitude=kwargs.get('longitude', 0.0)
        )
        return location

    def __call__(self, **kwargs):
        """Create and return a test location."""
        location = self.create(**kwargs)
        db.session.add(location)
        db.session.commit()
        return location

class VenueFactory:
    """Factory for creating test venues."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test venue."""
        # Create location if not provided
        if 'location' not in kwargs:
            location = LocationFactory()()
            kwargs['location'] = location
        
        # Create owner if not provided
        if 'owner' not in kwargs:
            owner = UserFactory()()
            kwargs['owner'] = owner
        
        venue = Venue(
            name=kwargs.get('name', f'Test Venue {datetime.utcnow().timestamp()}'),
            owner=kwargs['owner'],
            location=kwargs['location'],
            type=kwargs.get('type', 'pool_hall'),
            status=kwargs.get('status', 'active'),
            capacity=kwargs.get('capacity', 50),
            tables=kwargs.get('tables', 10),
            description=kwargs.get('description', 'Test venue description'),
            amenities=kwargs.get('amenities', ['parking', 'bar', 'food']),
            rules=kwargs.get('rules', ['no smoking', 'no outside food']),
            opening_hours=kwargs.get('opening_hours', {'mon': '9-17', 'tue': '9-17'})
        )
        return venue

    def __call__(self, **kwargs):
        """Create and return a test venue."""
        venue = self.create(**kwargs)
        db.session.add(venue)
        db.session.commit()
        return venue

class MatchFactory:
    """Factory for creating test matches."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test match."""
        # Create players if not provided
        if 'player1' not in kwargs:
            player1 = UserFactory()()
            kwargs['player1'] = player1
        if 'player2' not in kwargs:
            player2 = UserFactory()()
            kwargs['player2'] = player2
        
        # Create venue if not provided
        if 'venue' not in kwargs:
            venue = VenueFactory()()
            kwargs['venue'] = venue
        
        match = Match(
            player1=kwargs['player1'],
            player2=kwargs['player2'],
            venue=kwargs['venue'],
            game_type=kwargs.get('game_type', 'eight_ball'),
            status=kwargs.get('status', 'scheduled'),
            scheduled_time=kwargs.get('scheduled_time', datetime.utcnow() + timedelta(days=1)),
            completed_time=kwargs.get('completed_time', None),
            winner_id=kwargs.get('winner_id', None),
            player1_score=kwargs.get('player1_score', 0),
            player2_score=kwargs.get('player2_score', 0),
            notes=kwargs.get('notes', 'Test match notes')
        )
        return match

    def __call__(self, **kwargs):
        """Create and return a test match."""
        match = self.create(**kwargs)
        db.session.add(match)
        db.session.commit()
        return match

class GameFactory:
    """Factory for creating test games."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test game."""
        # Create players if not provided
        if 'player1' not in kwargs:
            player1 = UserFactory()()
            kwargs['player1'] = player1
        if 'player2' not in kwargs:
            player2 = UserFactory()()
            kwargs['player2'] = player2
        
        # Create venue if not provided
        if 'venue' not in kwargs:
            venue = VenueFactory()()
            kwargs['venue'] = venue
        
        # Create match if not provided and not explicitly set to None
        if 'match' not in kwargs and kwargs.get('match_id') is None:
            match = MatchFactory(
                player1=kwargs['player1'],
                player2=kwargs['player2'],
                venue=kwargs['venue']
            )()
            kwargs['match'] = match
        
        game = Game(
            player1=kwargs['player1'],
            player2=kwargs['player2'],
            venue=kwargs['venue'],
            match=kwargs.get('match'),
            game_type=kwargs.get('game_type', 'eight_ball'),
            status=kwargs.get('status', 'in_progress'),
            start_time=kwargs.get('start_time', datetime.utcnow()),
            end_time=kwargs.get('end_time', None),
            winner_id=kwargs.get('winner_id', None),
            player1_score=kwargs.get('player1_score', 0),
            player2_score=kwargs.get('player2_score', 0),
            notes=kwargs.get('notes', 'Test game notes')
        )
        return game

    def __call__(self, **kwargs):
        """Create and return a test game."""
        game = self.create(**kwargs)
        db.session.add(game)
        db.session.commit()
        return game

class TournamentFactory:
    """Factory for creating test tournaments."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test tournament."""
        # Create organizer if not provided
        if 'organizer' not in kwargs:
            organizer = UserFactory()()
            kwargs['organizer'] = organizer
        
        # Create venue if not provided
        if 'venue' not in kwargs:
            venue = VenueFactory()()
            kwargs['venue'] = venue
        
        tournament = Tournament(
            name=kwargs.get('name', f'Test Tournament {datetime.utcnow().timestamp()}'),
            organizer=kwargs['organizer'],
            venue=kwargs['venue'],
            tournament_type=kwargs.get('tournament_type', 'single_elimination'),
            status=kwargs.get('status', 'upcoming'),
            start_date=kwargs.get('start_date', datetime.utcnow() + timedelta(days=7)),
            end_date=kwargs.get('end_date', datetime.utcnow() + timedelta(days=8)),
            max_players=kwargs.get('max_players', 32),
            entry_fee=kwargs.get('entry_fee', 50.0),
            prize_pool=kwargs.get('prize_pool', 1000.0),
            rules=kwargs.get('rules', ['standard rules apply']),
            description=kwargs.get('description', 'Test tournament description')
        )
        return tournament

    def __call__(self, **kwargs):
        """Create and return a test tournament."""
        tournament = self.create(**kwargs)
        db.session.add(tournament)
        db.session.commit()
        return tournament

class SessionFactory:
    """Factory for creating test sessions."""
    
    @staticmethod
    def create(**kwargs):
        """Create a test session."""
        # Create user if not provided
        if 'user' not in kwargs:
            user = UserFactory()()
            kwargs['user'] = user
        
        session = Session(
            user=kwargs['user'],
            token=kwargs.get('token', f'test_token_{datetime.utcnow().timestamp()}'),
            expires_at=kwargs.get('expires_at', datetime.utcnow() + timedelta(hours=1)),
            ip_address=kwargs.get('ip_address', '127.0.0.1'),
            user_agent=kwargs.get('user_agent', 'Test User Agent'),
            device_type=kwargs.get('device_type', 'desktop')
        )
        return session

    def __call__(self, **kwargs):
        """Create and return a test session."""
        session = self.create(**kwargs)
        db.session.add(session)
        db.session.commit()
        return session

class TestData:
    """Container for common test data."""
    
    @staticmethod
    def create_roles():
        """Create default roles."""
        roles = {
            'admin': RoleFactory()(name='admin', description='Administrator role'),
            'user': RoleFactory()(name='user', description='Regular user role'),
            'moderator': RoleFactory()(name='moderator', description='Moderator role')
        }
        return roles
    
    @staticmethod
    def create_users(roles=None):
        """Create test users with roles."""
        if roles is None:
            roles = TestData.create_roles()
        
        users = {
            'admin': UserFactory()(roles=[roles['admin']]),
            'user': UserFactory()(roles=[roles['user']]),
            'moderator': UserFactory()(roles=[roles['moderator']])
        }
        return users
    
    @staticmethod
    def create_venues(owner=None):
        """Create test venues."""
        if owner is None:
            owner = UserFactory()()
        
        venues = [VenueFactory()(owner=owner) for _ in range(3)]
        return venues
    
    @staticmethod
    def create_tournament(organizer=None, venue=None):
        """Create a test tournament."""
        if organizer is None:
            organizer = UserFactory()()
        if venue is None:
            venue = VenueFactory()(owner=organizer)
        
        tournament = TournamentFactory()(
            organizer=organizer,
            venue=venue
        )
        return tournament