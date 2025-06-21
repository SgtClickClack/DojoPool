"""Device model module."""

from datetime import datetime
from typing import Any, Dict, Optional

from dojopool.extensions import db

from .base import TimestampedModel


class Device(TimestampedModel):
    """Model for storing mobile device information."""

    __tablename__ = "devices"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    device_id = db.Column(db.String(255), unique=True, nullable=False)
    device_name = db.Column(db.String(255), nullable=False)
    platform = db.Column(db.String(50), nullable=False)
    os_version = db.Column(db.String(50), nullable=False)
    app_version = db.Column(db.String(50))
    push_token = db.Column(db.String(255))
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    user = db.relationship("User", backref="devices")

    @classmethod
    def create(cls, **kwargs) -> "Device":
        """Create a new device."""
        device = cls(**kwargs)
        db.session.add(device)
        db.session.commit()
        return device

    @classmethod
    def get_by_id(cls, device_id: str) -> Optional["Device"]:
        """Get device by ID."""
        return cls.query.filter_by(id=device_id, is_active=True).first()

    @classmethod
    def get_by_device_id(cls, device_id: str) -> Optional["Device"]:
        """Get device by device_id."""
        return cls.query.filter_by(device_id=device_id, is_active=True).first()

    @classmethod
    def get_user_devices(cls, user_id: str) -> list["Device"]:
        """Get all active devices for a user."""
        return cls.query.filter_by(user_id=user_id, is_active=True).all()

    def update(self, data: Dict[str, Any]) -> bool:
        """Update device information."""
        try:
            for key, value in data.items():
                if hasattr(self, key):
                    setattr(self, key, value)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False

    def revoke_access(self) -> bool:
        """Revoke device access."""
        try:
            self.is_active = False
            self.push_token = None
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert device to dictionary."""
        base_dict = super().to_dict()
        device_dict = {
            "id": str(self.id),
            "device_id": self.device_id,
            "device_name": self.device_name,
            "platform": self.platform,
            "os_version": self.os_version,
            "app_version": self.app_version,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "is_active": self.is_active,
        }
        return {**base_dict, **device_dict}


__all__ = ["Device"]
