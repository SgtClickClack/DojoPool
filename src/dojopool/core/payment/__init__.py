"""Payment module."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import stripe
from flask import current_app

from dojopool.core.exceptions import PaymentError
from dojopool.models.transaction import Transaction
from dojopool.models.user import User
from dojopool.models.wallet import Wallet
from dojopool.extensions import db


class PaymentService:
    """Payment service."""

    def __init__(self):
        """Initialize payment service."""
        self.stripe = stripe
        self.stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")

    def create_customer(self, user_id: int) -> str:
        """Create Stripe customer for user.

        Args:
            user_id: User ID

        Returns:
            Stripe customer ID

        Raises:
            PaymentError: If customer creation fails
        """
        user = User.query.get(user_id)
        if not user:
            raise PaymentError("User not found")

        try:
            customer = self.stripe.Customer.create(email=user.email, metadata={"user_id": user_id})

            user.stripe_customer_id = customer.id
            db.session.commit()

            return customer.id
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create customer: {str(e)}")

    def add_payment_method(self, user_id: int, payment_method_id: str) -> Dict[str, Any]:
        """Add payment method to customer.

        Args:
            user_id: User ID
            payment_method_id: Stripe payment method ID

        Returns:
            Payment method details

        Raises:
            PaymentError: If payment method cannot be added
        """
        user = User.query.get(user_id)
        if not user:
            raise PaymentError("User not found")

        if not user.stripe_customer_id:
            self.create_customer(user_id)

        try:
            # Attach payment method to customer
            payment_method = self.stripe.PaymentMethod.attach(
                payment_method_id, customer=user.stripe_customer_id
            )

            # Set as default payment method
            self.stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={"default_payment_method": payment_method_id},
            )

            return {
                "id": payment_method.id,
                "type": payment_method.type,
                "card": (payment_method.card.to_dict() if payment_method.type == "card" else None),
            }
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to add payment method: {str(e)}")

    def remove_payment_method(self, user_id: int, payment_method_id: str) -> None:
        """Remove payment method from customer.

        Args:
            user_id: User ID
            payment_method_id: Stripe payment method ID

        Raises:
            PaymentError: If payment method cannot be removed
        """
        user = User.query.get(user_id)
        if not user:
            raise PaymentError("User not found")

        try:
            self.stripe.PaymentMethod.detach(payment_method_id)
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to remove payment method: {str(e)}")

    def get_payment_methods(self, user_id: int) -> List[Dict[str, Any]]:
        """Get customer's payment methods.

        Args:
            user_id: User ID

        Returns:
            List of payment methods

        Raises:
            PaymentError: If payment methods cannot be retrieved
        """
        user = User.query.get(user_id)
        if not user:
            raise PaymentError("User not found")

        if not user.stripe_customer_id:
            return []

        try:
            payment_methods = self.stripe.PaymentMethod.list(
                customer=user.stripe_customer_id, type="card"
            )

            return [
                {
                    "id": pm.id,
                    "type": pm.type,
                    "card": pm.card.to_dict() if pm.type == "card" else None,
                }
                for pm in payment_methods.data
            ]
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to get payment methods: {str(e)}")

    def create_payment_intent(
        self,
        user_id: int,
        amount: Decimal,
        currency: str = "usd",
        payment_method_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create payment intent.

        Args:
            user_id: User ID
            amount: Payment amount
            currency: Payment currency
            payment_method_id: Optional payment method ID
            metadata: Optional metadata

        Returns:
            Payment intent details

        Raises:
            PaymentError: If payment intent cannot be created
        """
        user = User.query.get(user_id)
        if not user:
            raise PaymentError("User not found")

        if not user.stripe_customer_id:
            self.create_customer(user_id)

        try:
            intent = self.stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                customer=user.stripe_customer_id,
                payment_method=payment_method_id,
                metadata=metadata or {},
            )

            return {
                "id": intent.id,
                "client_secret": intent.client_secret,
                "amount": amount,
                "currency": currency,
                "status": intent.status,
            }
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to create payment intent: {str(e)}")

    def confirm_payment(
        self, payment_intent_id: str, payment_method_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Confirm payment intent.

        Args:
            payment_intent_id: Payment intent ID
            payment_method_id: Optional payment method ID

        Returns:
            Payment confirmation details

        Raises:
            PaymentError: If payment cannot be confirmed
        """
        try:
            intent = self.stripe.PaymentIntent.confirm(
                payment_intent_id, payment_method=payment_method_id
            )

            return {
                "id": intent.id,
                "status": intent.status,
                "amount": Decimal(intent.amount) / 100,
                "currency": intent.currency,
            }
        except stripe.error.StripeError as e:
            raise PaymentError(f"Failed to confirm payment: {str(e)}")

    def process_webhook(self, event_data: Dict[str, Any]) -> None:
        """Process Stripe webhook event.

        Args:
            event_data: Webhook event data

        Raises:
            PaymentError: If webhook cannot be processed
        """
        try:
            event = self.stripe.Event.construct_from(event_data, self.stripe.api_key)

            if event.type == "payment_intent.succeeded":
                self._handle_payment_success(event.data.object)
            elif event.type == "payment_intent.payment_failed":
                self._handle_payment_failure(event.data.object)
        except Exception as e:
            raise PaymentError(f"Failed to process webhook: {str(e)}")

    def _handle_payment_success(self, payment_intent: stripe.PaymentIntent) -> None:
        """Handle successful payment.

        Args:
            payment_intent: Stripe payment intent
        """
        # Create transaction record
        user = User.query.filter_by(stripe_customer_id=payment_intent.customer).first()

        if user:
            transaction = Transaction(
                user_id=user.id,
                amount=Decimal(payment_intent.amount) / 100,
                currency=payment_intent.currency,
                status="completed",
                payment_method=payment_intent.payment_method,
                payment_intent_id=payment_intent.id,
                metadata=payment_intent.metadata,
            )

            db.session.add(transaction)

            # Update user's wallet
            wallet = Wallet.query.filter_by(user_id=user.id).first()
            if not wallet:
                wallet = Wallet(user_id=user.id, balance=0)
                db.session.add(wallet)

            wallet.balance += transaction.amount
            wallet.updated_at = datetime.utcnow()

            db.session.commit()

    def _handle_payment_failure(self, payment_intent: stripe.PaymentIntent) -> None:
        """Handle failed payment.

        Args:
            payment_intent: Stripe payment intent
        """
        # Create failed transaction record
        user = User.query.filter_by(stripe_customer_id=payment_intent.customer).first()

        if user:
            transaction = Transaction(
                user_id=user.id,
                amount=Decimal(payment_intent.amount) / 100,
                currency=payment_intent.currency,
                status="failed",
                payment_method=payment_intent.payment_method,
                payment_intent_id=payment_intent.id,
                metadata=payment_intent.metadata,
                error=(
                    payment_intent.last_payment_error.message
                    if payment_intent.last_payment_error
                    else None
                ),
            )

            db.session.add(transaction)
            db.session.commit()


payment_service = PaymentService()

__all__ = ["payment_service", "PaymentService"]
