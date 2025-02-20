from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, Optional

from .exceptions import PaymentError
from .models import Currency, PaymentMethod, Transaction

class PaymentProcessor(ABC):
    pass

class StripeProcessor(PaymentProcessor):
    pass

class PayPalProcessor(PaymentProcessor):
    pass
