"""Marketplace model module.

This module contains the models for the marketplace feature.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from dojopool.core.database import reference_col
from dojopool.core.extensions import db

from .base import TimestampedModel


class MarketplaceItem(TimestampedModel):
    """Marketplace item model."""

    __tablename__: str = "marketplace_items"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name: Any = db.Column(db.String(100), nullable=False)
    description: Any = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url: Any = db.Column(db.String(255))
    category: Any = db.Column(db.String(50))
    rarity = db.Column(db.String(20))
    stock: Any = db.Column(db.Integer, default=0)
    effects: Any = db.Column(JSON, default=[])
    preview_url: Any = db.Column(db.String(255))
    purchase_count: Any = db.Column(db.Integer, default=0)

    # Relationships
    transactions: Any = db.relationship("Transaction", backref="item", lazy="dynamic")
    inventory_items: Any = db.relationship(
        "UserInventory", backref="item", lazy="dynamic"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert item to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "image_url": self.image_url,
            "category": self.category,
            "rarity": self.rarity,
            "stock": self.stock,
            "effects": self.effects,
            "preview_url": self.preview_url,
            "purchase_count": self.purchase_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Transaction(TimestampedModel):
    """Transaction model."""

    __tablename__: str = "marketplace_transactions"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id: reference_col = reference_col("users", nullable=False)
    item_id: reference_col = reference_col("marketplace_items", nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_at_purchase: Any = db.Column(db.Float, nullable=False)
    status: Any = db.Column(db.String(20), nullable=False, default="pending")
    payment_method = db.Column(db.String(50))

    # Relationships
    user: Any = db.relationship("User", backref="marketplace_transactions")

    def to_dict(self):
        """Convert transaction to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "price_at_purchase": self.price_at_purchase,
            "status": self.status,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Wallet(TimestampedModel):
    """Wallet model."""

    __tablename__: str = "user_wallets"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id: reference_col = reference_col("users", nullable=False, unique=True)
    balance: Any = db.Column(db.Float, nullable=False, default=0)
    currency = db.Column(db.String(10), nullable=False, default="DP")
    transactions: Any = db.Column(JSON, default=[])

    # Relationships
    user: Any = db.relationship("User", backref=db.backref("wallet", uselist=False))

    def to_dict(self):
        """Convert wallet to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "balance": self.balance,
            "currency": self.currency,
            "transactions": self.transactions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def add_transaction(self, amount: float, type: str, description: str):
        """Add a transaction to the wallet."""
        transaction: Dict[Any, Any] = {
            "amount": amount,
            "type": type,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if not self.transactions:
            self.transactions: Any = []
        self.transactions.append(transaction)

        if type == "credit":
            self.balance += amount
        else:
            self.balance -= amount
        db.session.commit()


class UserInventory(TimestampedModel):
    """User inventory model."""

    __tablename__: str = "user_inventory"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id: reference_col = reference_col("users", nullable=False)
    item_id: reference_col = reference_col("marketplace_items", nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    expires_at: Any = db.Column(db.DateTime)
    is_active: Any = db.Column(db.Boolean, default=True)

    # Relationships
    user: Any = db.relationship("User", backref="inventory_items")

    def to_dict(self) -> Dict[str, Any]:
        """Convert inventory item to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def add_to_inventory(cls, user_id: int, item_id: int, quantity: int = 1):
        """Add an item to user's inventory."""
        inventory_item: Any = cls.query.filter_by(
            user_id=user_id, item_id=item_id, is_active=True
        ).first()

        if inventory_item:
            inventory_item.quantity += quantity
        else:
            inventory_item: Any = cls(
                user_id=user_id, item_id=item_id, quantity=quantity
            )
            db.session.add(inventory_item)
        db.session.commit()


__all__: List[Any] = ["MarketplaceItem", "Transaction", "Wallet", "UserInventory"]
