"""Inventory model."""

from datetime import datetime
from typing import Any, Dict, List

from dojopool.core.extensions import db

from .base import TimestampedModel


class Inventory(TimestampedModel):
    """Model for user inventory items."""

    __tablename__ = "inventories"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)  # 'cosmetic', 'achievement', etc.
    quantity = db.Column(db.Integer, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    user = db.relationship("User", back_populates="inventory")

    @classmethod
    def get_user_inventory(cls, user_id: int) -> List[Dict[str, Any]]:
        """Get user's inventory items."""
        items = (
            cls.query.filter_by(user_id=user_id, is_active=True)
            .filter((cls.expires_at.is_(None)) | (cls.expires_at > datetime.utcnow()))
            .all()
        )

        return [
            {
                "item_type": item.item_type,
                "quantity": item.quantity,
                "expires_at": item.expires_at.isoformat() if item.expires_at else None,
            }
            for item in items
        ]

    @classmethod
    def update_item_count(cls, user_id: int, item_type: str, quantity_change: int) -> None:
        """Update item quantity in inventory."""
        item = cls.query.filter_by(user_id=user_id, item_type=item_type, is_active=True).first()

        if item:
            item.quantity += quantity_change
            if item.quantity <= 0:
                item.is_active = False
        else:
            if quantity_change > 0:
                item = cls(user_id=user_id, item_type=item_type, quantity=quantity_change)
                db.session.add(item)

        db.session.commit()

    def to_dict(self) -> Dict[str, Any]:
        """Convert inventory item to dictionary."""
        base_dict = super().to_dict()
        inventory_dict = {
            "id": self.id,
            "user_id": self.user_id,
            "item_type": self.item_type,
            "quantity": self.quantity,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
        }
        return {**base_dict, **inventory_dict}

    def __repr__(self):
        """String representation of the inventory."""
        return f"<Inventory (User: {self.user_id}, Type: {self.item_type})>"


__all__ = ["Inventory"]
