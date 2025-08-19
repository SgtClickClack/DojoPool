"""Database models module.

This module contains core database models. Note that wallet and transaction models
are now unified in dojopool/models/marketplace.py to prevent duplication and ensure
consistency across the platform.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# WALLET AND TRANSACTION MODELS ARE NOW UNIFIED IN dojopool/models/marketplace.py
# This prevents duplication and ensures consistency across the platform.
# The unified models include:
# - Wallet: Unified wallet model for all payment and marketplace operations
# - Transaction: Unified transaction model for all wallet/payment/marketplace operations
# - MarketplaceItem: Items available for purchase
# - UserInventory: User's inventory of purchased items

# TODO: Remove duplicate User model to resolve SQLAlchemy registry conflicts.
# class User(Base):
#     ...

__all__ = ["Base"]