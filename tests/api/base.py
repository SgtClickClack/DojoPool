"""Base class for API tests."""
import json
from datetime import datetime, timedelta
from flask import url_for
from tests.base import TestBase
from src.core.database import db, init_db
from src.models import (
    User, Game, Tournament, Venue, Role, Location,
    Achievement, UserAchievement, Rating, Leaderboard, UserReward,
    Review, ReviewResponse, ReviewReport, ReviewVote, Notification,
    Session
)

class ApiTestBase(TestBase):
    """Base class for API tests."""
    
    def setUp(self):
        """Set up test case."""
        super().setUp()
        
        # Initialize database
        with self.app.app_context():
            init_db(self.app)
        
        self.client = self.app.test_client()
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def get_auth_headers(self, token=None):
        """Get headers with authentication token."""
        headers = self.headers.copy()
        if token:
            headers['Authorization'] = f'Bearer {token}'
        return headers
    
    def post_json(self, url, data, headers=None):
        """Send POST request with JSON data."""
        if headers is None:
            headers = self.headers
        with self.app.app_context():
            return self.client.post(
                url,
                data=json.dumps(data),
                headers=headers
            )
    
    def get_json(self, url, headers=None):
        """Send GET request and return JSON response."""
        if headers is None:
            headers = self.headers
        with self.app.app_context():
            return self.client.get(url, headers=headers)
    
    def put_json(self, url, data, headers=None):
        """Send PUT request with JSON data."""
        if headers is None:
            headers = self.headers
        with self.app.app_context():
            return self.client.put(
                url,
                data=json.dumps(data),
                headers=headers
            )
    
    def delete_json(self, url, headers=None):
        """Send DELETE request."""
        if headers is None:
            headers = self.headers
        with self.app.app_context():
            return self.client.delete(url, headers=headers)
    
    def assert_status(self, response, status_code):
        """Assert response status code."""
        assert response.status_code == status_code, \
            f'Expected status code {status_code}, got {response.status_code}'
    
    def assert_error_response(self, response, status_code, message=None):
        """Assert error response format."""
        self.assert_status(response, status_code)
        data = json.loads(response.data)
        assert 'error' in data
        if message:
            assert data['error'] == message
    
    def assert_json_response(self, response, status_code=200):
        """Assert JSON response format."""
        self.assert_status(response, status_code)
        assert response.content_type == 'application/json'
        return json.loads(response.data)
    
    def create_url(self, endpoint, **kwargs):
        """Create URL for endpoint."""
        with self.app.test_request_context():
            return url_for(endpoint, **kwargs)
    
    def create_test_user(self, username='testuser', email='test@example.com', password='password123'):
        """Create a test user."""
        with self.app.app_context():
            user = User(
                username=username,
                email=email,
                is_verified=True
            )
            user.set_password(password)
            
            # Add user role
            user_role = Role.query.filter_by(name='user').first()
            if user_role:
                user.roles.append(user_role)
            
            db.session.add(user)
            db.session.commit()
            return user
    
    def create_test_session(self, user):
        """Create a test session."""
        with self.app.app_context():
            session = Session(
                user_id=user.id,
                session_id=Session._generate_session_id(),
                device_info={
                    'browser': 'Chrome',
                    'os': 'Windows',
                    'device': 'Desktop'
                },
                ip_address='127.0.0.1',
                user_agent='Mozilla/5.0',
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            db.session.add(session)
            db.session.commit()
            return session
    
    def create_test_location(self):
        """Create a test location."""
        with self.app.app_context():
            location = Location(
                name='Test Location',
                address='123 Test St',
                city='Test City',
                state='Test State',
                country='Test Country',
                postal_code='12345',
                operating_hours={
                    'monday': '9:00-22:00',
                    'tuesday': '9:00-22:00',
                    'wednesday': '9:00-22:00',
                    'thursday': '9:00-22:00',
                    'friday': '9:00-23:00',
                    'saturday': '10:00-23:00',
                    'sunday': '10:00-22:00'
                },
                amenities={
                    'tables': 10,
                    'has_bar': True,
                    'has_restaurant': False,
                    'parking_available': True
                }
            )
            db.session.add(location)
            db.session.commit()
            return location
    
    def create_test_venue(self, owner, location):
        """Create a test venue."""
        with self.app.app_context():
            venue = Venue(
                name='Test Pool Hall',
                description='A test pool hall',
                location_id=location.id,
                owner_id=owner.id,
                status='active',
                capacity=50,
                amenities={
                    'tables': 10,
                    'has_bar': True,
                    'has_restaurant': False
                }
            )
            db.session.add(venue)
            db.session.commit()
            return venue
    
    def create_test_game(self, player1, player2, venue):
        """Create a test game."""
        with self.app.app_context():
            game = Game(
                player1_id=player1.id,
                player2_id=player2.id,
                venue_id=venue.id,
                game_type='8-ball',
                status='pending',
                config={
                    'game_type': '8-ball',
                    'race_to': 5
                }
            )
            db.session.add(game)
            db.session.commit()
            return game
    
    def create_test_tournament(self, organizer, venue):
        """Create a test tournament."""
        with self.app.app_context():
            tournament = Tournament(
                name='Test Tournament',
                description='A test tournament',
                venue_id=venue.id,
                organizer_id=organizer.id,
                format='single_elimination',
                status='draft',
                max_players=16,
                entry_fee=50.0,
                prize_pool=1000.0,
                rules={
                    'game_type': '8-ball',
                    'best_of': 3,
                    'time_limit': 3600
                },
                registration_start=datetime.utcnow(),
                registration_end=datetime.utcnow() + timedelta(days=1),
                start_date=datetime.utcnow() + timedelta(days=2),
                end_date=datetime.utcnow() + timedelta(days=3)
            )
            db.session.add(tournament)
            db.session.commit()
            return tournament
    