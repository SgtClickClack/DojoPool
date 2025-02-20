from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

import stripe
from flask import current_app
from stripe.error import StripeError

from ..exceptions import PaymentError
from ..models import db
from .models import Payment, Subscription

class StripeService:
    pass
