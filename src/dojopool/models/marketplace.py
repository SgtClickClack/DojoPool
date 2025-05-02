"""Marketplace model module.

This module contains the models for the marketplace feature.
"""

from datetime import datetime
from typing import Any, Dict, Optional, List, Tuple

from sqlalchemy import JSON, Column, Integer, String, DateTime, Boolean, Float, ForeignKey, desc
from sqlalchemy.orm import relationship

from dojopool.core.database.db_utils import reference_col
from dojopool.core.extensions import db
from dojopool.core.venue.audit import AuditLogger, AuditEventType

from .base import TimestampedModel

# Instantiate AuditLogger (Consider dependency injection or app context for better practice)
# Assuming log directory setup is handled elsewhere or defaults are okay
audit_logger = AuditLogger()


class MarketplaceItem(TimestampedModel):
    """Marketplace item model."""

    __tablename__ = "marketplace_items"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255))
    category = db.Column(db.String(50))
    rarity = db.Column(db.String(20))
    stock = db.Column(db.Integer, default=0)
    effects = db.Column(JSON, default=list)
    preview_url = db.Column(db.String(255))
    purchase_count = db.Column(db.Integer, default=0)

    # Relationships
    transactions = db.relationship("Transaction", backref="item", lazy="dynamic")
    inventory_items = db.relationship("UserInventory", backref="item", lazy="dynamic")

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


# UNIFIED WALLET & TRANSACTION MODELS
class Wallet(db.Model):
    """Unified Wallet model for all payment and marketplace operations."""
    __tablename__ = "wallets"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    balance = db.Column(db.Float, nullable=False, default=0.0)
    currency = db.Column(db.String(10), nullable=False, default="DP")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("wallet", uselist=False))
    transactions = db.relationship("Transaction", backref="wallet", lazy="dynamic")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "balance": self.balance,
            "currency": self.currency,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def _log_wallet_event(self, event_type: AuditEventType, action: str, status: str, details: Dict[str, Any], reference_id: Optional[str] = None):
        """Helper method to log wallet-related audit events."""
        # Ensure reference_id is a string for logging
        log_ref_id = str(reference_id) if reference_id is not None else "N/A"
        # Assuming admin actions might not have a specific user context directly here
        # This might need adjustment based on how admin actions are tracked
        audit_logger.log_event(
            event_type=event_type,
            user_id=str(self.user_id), # Log the affected user ID
            ip_address=None, # Admin actions might not have request IP
            resource_id=str(self.id), # Wallet ID
            action=action,
            status=status,
            details=details,
            venue_id=None, # Wallet actions are not venue-specific
            table_id=None,
            reference_id=log_ref_id # Use the processed string reference ID
        )

    def credit(self, amount: float, description: str = "", reference_id: Optional[str] = None, admin_user_id: Optional[str] = None) -> "Transaction":
        """Add Dojo Coins to the wallet and record a credit transaction."""
        if not self.is_active:
            self._log_wallet_event(AuditEventType.WALLET_CREDIT, "Credit Attempt (Inactive Wallet)", "failure", {"amount": amount, "description": description, "reason": "Wallet is inactive"}, reference_id=reference_id)
            raise ValueError("Wallet is inactive.")
        if amount <= 0:
            self._log_wallet_event(AuditEventType.WALLET_CREDIT, "Credit Attempt (Invalid Amount)", "failure", {"amount": amount, "description": description, "reason": "Credit amount must be positive"}, reference_id=reference_id)
            raise ValueError("Credit amount must be positive.")

        self.balance += amount
        txn = Transaction(
            wallet_id=self.id,
            user_id=self.user_id,
            amount=amount,
            currency=self.currency,
            type="credit",
            status="completed",
            description=description,
            reference_id=reference_id
        )
        db.session.add(txn)
        db.session.commit()

        # Log audit event after successful commit
        self._log_wallet_event(
            event_type=AuditEventType.WALLET_CREDIT,
            action="Wallet Credit",
            status="success",
            details={
                "amount": amount,
                "new_balance": self.balance,
                "description": description,
                "reference_id": reference_id,
                "transaction_id": txn.id,
                "admin_user_id": admin_user_id
            }
        )
        return txn

    def debit(self, amount: float, description: str = "", reference_id: Optional[str] = None, admin_user_id: Optional[str] = None) -> "Transaction":
        """Subtract Dojo Coins from the wallet and record a debit transaction."""
        if not self.is_active:
            self._log_wallet_event(AuditEventType.WALLET_DEBIT, "Debit Attempt (Inactive Wallet)", "failure", {"amount": amount, "description": description, "reference_id": reference_id, "reason": "Wallet is inactive"})
            raise ValueError("Wallet is inactive.")
        if amount <= 0:
            self._log_wallet_event(AuditEventType.WALLET_DEBIT, "Debit Attempt (Invalid Amount)", "failure", {"amount": amount, "description": description, "reference_id": reference_id, "reason": "Debit amount must be positive"})
            raise ValueError("Debit amount must be positive.")
        if self.balance < amount:
            self._log_wallet_event(AuditEventType.WALLET_DEBIT, "Debit Attempt (Insufficient Funds)", "failure", {"amount": amount, "current_balance": self.balance, "description": description, "reference_id": reference_id, "reason": "Insufficient funds"})
            raise ValueError("Insufficient funds.")

        self.balance -= amount
        txn = Transaction(
            wallet_id=self.id,
            user_id=self.user_id,
            amount=-amount,
            currency=self.currency,
            type="debit",
            status="completed",
            description=description,
            reference_id=reference_id
        )
        db.session.add(txn)
        db.session.commit()

        # Log audit event after successful commit
        self._log_wallet_event(
            event_type=AuditEventType.WALLET_DEBIT,
            action="Wallet Debit",
            status="success",
            details={
                "amount": amount,
                "new_balance": self.balance,
                "description": description,
                "reference_id": reference_id,
                "transaction_id": txn.id,
                "admin_user_id": admin_user_id
            }
        )
        return txn

    def transfer_to(self, target_wallet: "Wallet", amount: float, description: str = "", reference_id: Optional[str] = None, admin_user_id: Optional[str] = None) -> Tuple["Transaction", "Transaction"]:
        """Transfer Dojo Coins to another wallet, recording debit and credit transactions."""
        if not self.is_active:
            self._log_wallet_event(AuditEventType.WALLET_TRANSFER, "Transfer Attempt (Sender Inactive)", "failure", {"amount": amount, "target_wallet_id": target_wallet.id, "description": description, "reference_id": reference_id, "reason": "Sender wallet is inactive"})
            raise ValueError("Sender wallet is inactive.")
        if not target_wallet.is_active:
            self._log_wallet_event(AuditEventType.WALLET_TRANSFER, "Transfer Attempt (Recipient Inactive)", "failure", {"amount": amount, "target_wallet_id": target_wallet.id, "description": description, "reference_id": reference_id, "reason": "Recipient wallet is inactive"})
            raise ValueError("Recipient wallet is inactive.")
        if amount <= 0:
            self._log_wallet_event(AuditEventType.WALLET_TRANSFER, "Transfer Attempt (Invalid Amount)", "failure", {"amount": amount, "target_wallet_id": target_wallet.id, "description": description, "reference_id": reference_id, "reason": "Transfer amount must be positive"})
            raise ValueError("Transfer amount must be positive.")
        if self.balance < amount:
            self._log_wallet_event(AuditEventType.WALLET_TRANSFER, "Transfer Attempt (Insufficient Funds)", "failure", {"amount": amount, "current_balance": self.balance, "target_wallet_id": target_wallet.id, "description": description, "reference_id": reference_id, "reason": "Insufficient funds for transfer"})
            raise ValueError("Insufficient funds for transfer.")

        # Use existing debit/credit methods which handle balance update, transaction, and audit logging
        try:
            # Note: Pass admin_user_id to debit/credit if needed for those logs too
            debit_desc = f"Transfer to user {target_wallet.user_id}. {description}"
            credit_desc = f"Transfer from user {self.user_id}. {description}"
            debit_txn = self.debit(amount, description=debit_desc, reference_id=reference_id, admin_user_id=admin_user_id)
            credit_txn = target_wallet.credit(amount, description=credit_desc, reference_id=reference_id, admin_user_id=admin_user_id)

            # Log a specific transfer event summarizing the operation
            self._log_wallet_event(
                event_type=AuditEventType.WALLET_TRANSFER,
                action="Wallet Transfer",
                status="success",
                details={
                    "amount": amount,
                    "sender_wallet_id": self.id,
                    "sender_new_balance": self.balance,
                    "recipient_wallet_id": target_wallet.id,
                    "recipient_new_balance": target_wallet.balance,
                    "description": description,
                    "reference_id": reference_id,
                    "debit_transaction_id": debit_txn.id,
                    "credit_transaction_id": credit_txn.id,
                    "admin_user_id": admin_user_id
                }
            )
            return debit_txn, credit_txn
        except Exception as e:
            # If credit fails after debit, we need to handle rollback or compensation
            # For simplicity now, just log the failure. Real implementation needs robust transaction management.
            self._log_wallet_event(
                event_type=AuditEventType.WALLET_TRANSFER,
                action="Wallet Transfer",
                status="failure",
                details={
                    "amount": amount,
                    "sender_wallet_id": self.id,
                    "recipient_wallet_id": target_wallet.id,
                    "description": description,
                    "reference_id": reference_id,
                    "error": str(e)
                }
            )
            raise e

    def freeze(self) -> None:
        """Freeze the wallet (disable all outgoing transactions)."""
        self.is_active = False
        db.session.add(self)
        db.session.commit()
        self._log_wallet_event(AuditEventType.WALLET_FREEZE, "Wallet Freeze", "success", {"wallet_id": self.id, "reason": "Admin action"})

    def reactivate(self) -> None:
        """Reactivate a frozen wallet."""
        self.is_active = True
        db.session.add(self)
        db.session.commit()
        self._log_wallet_event(AuditEventType.WALLET_REACTIVATE, "Wallet Reactivate", "success", {"wallet_id": self.id, "reason": "Admin action"})

    def audit(self) -> dict:
        """Return a summary audit of the wallet: balance, total credits, total debits, transaction count."""
        credits = sum(txn.amount for txn in self.transactions.filter(Transaction.type == "credit"))
        debits = sum(-txn.amount for txn in self.transactions.filter(Transaction.type == "debit"))
        txn_count = self.transactions.count()
        return {
            "user_id": self.user_id,
            "balance": self.balance,
            "total_credits": credits,
            "total_debits": debits,
            "transaction_count": txn_count,
            "is_active": self.is_active
        }

    def get_audit_trail(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[Dict]:
        """Retrieve the audit trail for this specific wallet."""
        # Log the audit access itself
        # Consider who is accessing this - needs admin context
        # self._log_wallet_event(AuditEventType.WALLET_AUDIT, "Wallet Audit Accessed", "success", {})

        return audit_logger.get_events(
            event_type=AuditEventType.WALLET_AUDIT,
            user_id=str(self.user_id),
            start_time=start_time,
            end_time=end_time
            # Potentially add relevant event types:
            # event_type=[AuditEventType.WALLET_CREDIT, AuditEventType.WALLET_DEBIT, ...]
        )

    def get_transactions(self, limit: int = 20, offset: int = 0, txn_type: Optional[str] = None, status: Optional[str] = None) -> list:
        """
        Return a list of this wallet's transactions, optionally filtered by type/status.
        Results are ordered by most recent first.
        """
        query = self.transactions.order_by(Transaction.created_at.desc())
        if txn_type:
            query = query.filter(Transaction.type == txn_type)
        if status:
            query = query.filter(Transaction.status == status)
        return [txn.to_dict() for txn in query.offset(offset).limit(limit)]

    def get_balance(self) -> float:
        """Return the current wallet balance."""
        return self.balance


class Transaction(db.Model):
    """Unified Transaction model for all wallet/payment/marketplace operations."""
    __tablename__ = "transactions"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    wallet_id = db.Column(db.Integer, db.ForeignKey("wallets.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False, default="DP")
    type = db.Column(db.String(50), nullable=False)  # credit, debit, purchase, refund, etc.
    status = db.Column(db.String(20), nullable=False, default="pending")
    description = db.Column(db.String(255))
    reference_id = db.Column(db.String(100))  # External payment reference or order ID
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="transactions")

    # Add explicit __init__ to help type checkers
    def __init__(self, wallet_id: int, user_id: int, amount: float, currency: str, type: str, status: str, description: Optional[str] = None, reference_id: Optional[str] = None):
        self.wallet_id = wallet_id
        self.user_id = user_id
        self.amount = amount
        self.currency = currency
        self.type = type
        self.status = status
        self.description = description
        self.reference_id = reference_id
        # created_at and updated_at have defaults

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "wallet_id": self.wallet_id,
            "user_id": self.user_id,
            "amount": self.amount,
            "currency": self.currency,
            "type": self.type,
            "status": self.status,
            "description": self.description,
            "reference_id": self.reference_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserInventory(TimestampedModel):
    """User inventory model."""

    __tablename__ = "user_inventory"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = reference_col("users", nullable=False)
    item_id = reference_col("marketplace_items", nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    user = db.relationship("User", backref="inventory_items")

    # Add explicit __init__
    def __init__(self, user_id: int, item_id: int, quantity: int = 1, expires_at: Optional[datetime] = None, is_active: bool = True):
        self.user_id = user_id
        self.item_id = item_id
        self.quantity = quantity
        self.expires_at = expires_at
        self.is_active = is_active

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
    def add_to_inventory(cls, user_id: int, item_id: int, quantity: int = 1) -> None:
        """Add an item to user's inventory."""
        inventory_item = cls.query.filter_by(
            user_id=user_id, item_id=item_id, is_active=True
        ).first()

        if inventory_item:
            inventory_item.quantity += quantity
        else:
            inventory_item = cls(user_id=user_id, item_id=item_id, quantity=quantity)
            db.session.add(inventory_item)
        db.session.commit()


# --- Add New WalletTransaction Model ---
class WalletTransaction(db.Model): # Assuming db.Model is the correct base
    """Wallet transaction model."""
    __tablename__ = 'wallet_transactions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String(16), nullable=False)  # deposit, withdraw
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Ensure relationship name matches the one added in User model
    user = relationship('User', back_populates='wallet_transactions')

# --- End New WalletTransaction Model ---

__all__ = ["MarketplaceItem", "Wallet", "Transaction", "UserInventory", "WalletTransaction"]
