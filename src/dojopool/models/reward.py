"""Reward models."""

from ..core.database import db
from ..core.mixins import TimestampMixin


class UserReward(TimestampMixin, db.Model):
    """Model for user rewards."""

    __tablename__ = "user_rewards"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # achievement, tournament, special_event, etc.
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    value = db.Column(db.Float, default=0.0)  # Monetary or point value
    status = db.Column(db.String(20), default="active")  # active, redeemed, expired
    redeemed_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)

    # Additional reward data stored as JSON
    data = db.Column(db.JSON)

    # Relationships
    user = db.relationship("User", back_populates="rewards")

    def to_dict(self):
        """Convert reward to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "name": self.name,
            "description": self.description,
            "value": self.value,
            "status": self.status,
            "redeemed_at": self.redeemed_at.isoformat() if self.redeemed_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        """String representation of the reward."""
        return f"<UserReward {self.name} for {self.user_id}>"
