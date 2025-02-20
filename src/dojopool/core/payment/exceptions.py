from decimal import Decimal
from typing import Optional


class PaymentError(Exception):
    """Base exception for payment-related errors."""

    def __init__(self, message: str, code: Optional[str] = None) -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class InsufficientFundsError(PaymentError):
    """Raised when a user has insufficient funds for a transaction."""

    def __init__(self, amount_needed: Decimal, amount_available: Decimal):
        self.amount_needed = amount_needed
        self.amount_available = amount_available
        message = (
            f"Insufficient funds: needed {amount_needed}, available {amount_available}"
        )
        super().__init__(message, code="INSUFFICIENT_FUNDS")


class InvalidPaymentMethodError(PaymentError):
    """Raised when payment method is invalid or not supported."""

    def __init__(self, payment_method: str):
        message = f"Invalid or unsupported payment method: {payment_method}"
        super().__init__(message, code="INVALID_PAYMENT_METHOD")


class PaymentProcessingError(PaymentError):
    """Raised when payment processing fails."""

    def __init__(self, message: str, transaction_id: Optional[str] = None):
        self.transaction_id = transaction_id
        super().__init__(message, code="PAYMENT_PROCESSING_ERROR")
