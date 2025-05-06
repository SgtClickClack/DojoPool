from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

class WalletTransaction(Base):
    """Wallet transaction model."""
    __tablename__ = 'wallet_transactions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String(16), nullable=False)  # deposit, withdraw
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='wallet_transactions')

# TODO: Remove duplicate User model to resolve SQLAlchemy registry conflicts.
# class User(Base):
#     ...

__all__ = ["User", "WalletTransaction", "Base"]