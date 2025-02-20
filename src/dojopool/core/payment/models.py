from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    DOJO = "DOJO"  # Internal game currency


class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    CRYPTO = "crypto"
    INTERNAL = "internal"


class Transaction(BaseModel):
    id: str
    amount: Decimal
    currency: Currency
    payment_method: PaymentMethod
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]
    user_id: str
    description: Optional[str] = None
    external_reference: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
