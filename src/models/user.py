"""User model for pool players."""
from datetime import datetime
from flask_login import UserMixin
from src.core.database import db
from src.core.mixins import TimestampMixin
from src.core.auth.security import hash_password, verify_password

class User(UserMixin, TimestampMixin, db.Model):
    """Model for pool players."""
    
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    
    # Profile fields
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    avatar_url = db.Column(db.String(200))
    bio = db.Column(db.Text)
    
    # Player statistics stored as JSON
    stats = db.Column(db.JSON)
    
    # Relationships
    roles = db.relationship('Role', secondary='user_roles', back_populates='users')
    matches_as_player1 = db.relationship('Match', foreign_keys='Match.player1_id', back_populates='player1')
    matches_as_player2 = db.relationship('Match', foreign_keys='Match.player2_id', back_populates='player2')
    matches_won = db.relationship('Match', foreign_keys='Match.winner_id', back_populates='winner')
    games_as_player1 = db.relationship('Game', foreign_keys='Game.player1_id', back_populates='player1')
    games_as_player2 = db.relationship('Game', foreign_keys='Game.player2_id', back_populates='player2')
    won_games = db.relationship('Game', foreign_keys='Game.winner_id', back_populates='winner')
    games = db.relationship('Game', secondary='game_players', back_populates='players')
    events = db.relationship('Event', back_populates='player', cascade='all, delete-orphan')
    shots = db.relationship('Shot', back_populates='player', cascade='all, delete-orphan')
    leaderboard_entries = db.relationship('Leaderboard', back_populates='user', cascade='all, delete-orphan')
    tokens = db.relationship('Token', back_populates='user', cascade='all, delete-orphan')
    rewards = db.relationship('UserReward', back_populates='user', cascade='all, delete-orphan')
    friendships_as_user1 = db.relationship('Friendship', foreign_keys='Friendship.user1_id', back_populates='user1')
    friendships_as_user2 = db.relationship('Friendship', foreign_keys='Friendship.user2_id', back_populates='user2')
    friendship_actions = db.relationship('Friendship', foreign_keys='Friendship.action_user_id', back_populates='action_user')
    achievements = db.relationship('UserAchievement', back_populates='user', cascade='all, delete-orphan')
    sessions = db.relationship('Session', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    organized_tournaments = db.relationship('Tournament', foreign_keys='Tournament.organizer_id', back_populates='organizer')
    tournament_participations = db.relationship('TournamentParticipant', back_populates='user')
    review_votes = db.relationship('ReviewVote', back_populates='user')
    owned_venues = db.relationship('Venue', back_populates='owner')
    ratings = db.relationship('Rating', back_populates='user')
    notifications = db.relationship('Notification', back_populates='user')
    reviews = db.relationship('Review', back_populates='user')
    review_responses = db.relationship('ReviewResponse', back_populates='user')
    review_reports = db.relationship('ReviewReport', back_populates='user')
    venue_bookings = db.relationship('VenueBooking', back_populates='user')
    chat_rooms = db.relationship('ChatParticipant', back_populates='user')
    sent_messages = db.relationship('ChatMessage', foreign_keys='ChatMessage.sender_id', back_populates='sender')
    
    def __repr__(self):
        """String representation of the user."""
        return f'<User {self.username}>'
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'stats': self.stats,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create user from dictionary."""
        return User(
            username=data.get('username'),
            email=data.get('email'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            avatar_url=data.get('avatar_url'),
            bio=data.get('bio'),
            stats=data.get('stats', {})
        )
    
    def get_id(self):
        """Get user ID for Flask-Login."""
        return str(self.id)
    
    def get_verification_token(self):
        """Get email verification token."""
        from src.models import Token
        token = Token.generate_token(self.id, 'verify_email', expires_in=24*3600)
        return token.token
    
    def verify_email(self):
        """Verify user's email address."""
        self.email_verified = True
        db.session.commit()
    
    def update_stats(self, stats):
        """Update user statistics."""
        if not self.stats:
            self.stats = {}
        self.stats.update(stats)
        db.session.commit()
    
    def set_password(self, password):
        """Set user password."""
        self.password_hash = hash_password(password)
    
    def check_password(self, password):
        """Check if password is correct."""
        if not self.password_hash:
            return False
        return verify_password(self.password_hash, password)