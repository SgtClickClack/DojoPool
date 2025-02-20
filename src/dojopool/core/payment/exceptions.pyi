from decimal import Decimal
from typing import Optional

class PaymentError(Exception):
    pass

class InsufficientFundsError(PaymentError):
    pass

class InvalidPaymentMethodError(PaymentError):
    pass

class PaymentProcessingError(PaymentError):
    pass
