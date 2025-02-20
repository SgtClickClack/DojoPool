from decimal import Decimal
from typing import Any, Dict, Optional

from .exceptions import PaymentError
from .models import Currency, PaymentMethod


def validate_payment(
    amount: Decimal,
    currency: str,
    payment_method: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Validates a payment request."""
    if amount <= Decimal("0"):
        raise PaymentError("Payment amount must be positive")

    try:
        Currency(currency.upper())
    except ValueError:
        raise PaymentError(f"Invalid currency: {currency}")

    try:
        PaymentMethod(payment_method.lower())
    except ValueError:
        raise PaymentError(f"Invalid payment method: {payment_method}")

    return True


def validate_currency(currency_code: str):
    """Validates and returns a Currency enum."""
    try:
        return Currency(currency_code.upper())
    except ValueError:
        raise PaymentError(f"Invalid currency: {currency_code}")
