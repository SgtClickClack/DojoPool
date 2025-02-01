"""Payment models module."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import db
from .base import BaseModel


class Payment(BaseModel):
    """Payment model."""

    __tablename__ = "payments"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default="USD", nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)  # subscription, tournament_entry, etc.
    status = db.Column(db.String(20), default="pending")  # pending, completed, failed, refunded
    reference_id = db.Column(db.String(100))  # External payment reference
    payment_method = db.Column(db.String(50))  # credit_card, paypal, etc.
    payment_details = db.Column(db.JSON)  # Store payment method details
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship("User", backref=db.backref("payments", lazy="dynamic"))

    def __repr__(self):
        return f"<Payment {self.id}:{self.amount}:{self.status}>"

    def complete(self, reference_id):
        """Mark payment as completed.

        Args:
            reference_id: External payment reference
        """
        self.status = "completed"
        self.reference_id = reference_id
        db.session.commit()

    def fail(self):
        """Mark payment as failed."""
        self.status = "failed"
        db.session.commit()

    def refund(self):
        """Mark payment as refunded."""
        self.status = "refunded"
        db.session.commit()


class Subscription(BaseModel):
    """Subscription model."""

    __tablename__ = "subscriptions"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey("pricing_plans.id"), nullable=False)
    status = db.Column(db.String(20), default="active")  # active, cancelled, expired
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    auto_renew = db.Column(db.Boolean, default=True)
    last_payment_date = db.Column(db.DateTime)
    next_payment_date = db.Column(db.DateTime)

    # Relationships
    user = db.relationship("User", backref=db.backref("subscriptions", lazy="dynamic"))
    plan = db.relationship("PricingPlan", backref=db.backref("subscriptions", lazy="dynamic"))

    def __repr__(self):
        return f"<Subscription {self.user_id}:{self.plan_id}>"

    def cancel(self):
        """Cancel subscription."""
        self.status = "cancelled"
        self.auto_renew = False
        db.session.commit()

    def renew(self, end_date):
        """Renew subscription.

        Args:
            end_date: New end date
        """
        self.end_date = end_date
        self.last_payment_date = datetime.utcnow()
        self.next_payment_date = end_date
        db.session.commit()


class PricingPlan(BaseModel):
    """Pricing plan model."""

    __tablename__ = "pricing_plans"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default="USD", nullable=False)
    billing_interval = db.Column(db.String(20), nullable=False)  # monthly, yearly
    features = db.Column(db.JSON)  # List of included features
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f"<PricingPlan {self.name}>"

    def deactivate(self):
        """Deactivate pricing plan."""
        self.is_active = False
        db.session.commit()

    def activate(self):
        """Activate pricing plan."""
        self.is_active = True
        db.session.commit()

    def update_price(self, price):
        """Update plan price.

        Args:
            price: New price
        """
        self.price = price
        db.session.commit()


class MarketplaceItem(BaseModel):
    """Marketplace item model."""

    __tablename__ = "marketplace_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    category = Column(String(50), nullable=False)  # equipment, accessory, etc.
    condition = Column(String(50))  # new, used, etc.
    quantity = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    images = Column(db.JSON)  # List of image URLs

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    seller = relationship("User", backref="marketplace_items")

    def __repr__(self):
        return f"<MarketplaceItem {self.name}>"


class Transaction(BaseModel):
    """Transaction model."""

    __tablename__ = "transactions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("marketplace_items.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(20), default="pending")  # pending, completed, cancelled
    payment_method = Column(String(50))
    transaction_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], backref="purchases")
    seller = relationship("User", foreign_keys=[seller_id], backref="sales")
    item = relationship("MarketplaceItem")

    def __repr__(self):
        return f"<Transaction {self.id}>"


class Wallet(BaseModel):
    """Wallet model."""

    __tablename__ = "wallets"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="USD", nullable=False)
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="wallet")

    def __repr__(self):
        return f"<Wallet {self.user_id}>"


class UserInventory(BaseModel):
    """User inventory model."""

    __tablename__ = "user_inventories"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="inventory")
    item = relationship("Inventory")

    def __repr__(self):
        return f"<UserInventory {self.user_id}:{self.item_id}>"


class Inventory(BaseModel):
    """Inventory item model."""

    __tablename__ = "inventory_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False)  # equipment, accessory, etc.
    rarity = Column(String(20))  # common, rare, etc.
    tradeable = Column(Boolean, default=True)
    image_url = Column(String(255))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Inventory {self.name}>"
