from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, Optional

from .exceptions import PaymentError
from .models import Currency, PaymentMethod, Transaction


class PaymentProcessor(ABC):
    """Abstract base class for payment processors."""

    @abstractmethod
    async def process_payment(
        self,
        amount: Decimal,
        currency: Currency,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Transaction:
        """Process a payment transaction."""
        pass

    @abstractmethod
    async def refund_payment(self, transaction_id: str):
        """Refund a processed payment."""
        pass


class StripeProcessor(PaymentProcessor):
    """Stripe payment processor implementation."""

    async def process_payment(
        self,
        amount: Decimal,
        currency: Currency,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        # Implementation for Stripe payment processing
        raise NotImplementedError()

    async def refund_payment(self, transaction_id: str):
        # Implementation for Stripe refund
        raise NotImplementedError()


class PayPalProcessor(PaymentProcessor):
    """PayPal payment processor implementation."""

    async def process_payment(
        self,
        amount: Decimal,
        currency: Currency,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Transaction:
        # Implementation for PayPal payment processing
        raise NotImplementedError()

    async def refund_payment(self, transaction_id: str):
        # Implementation for PayPal refund
        raise NotImplementedError()
