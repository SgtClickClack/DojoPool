"""
Stripe payment service for DojoPool.
Handles Stripe API integration and payment processing.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

import stripe
from flask import current_app
from stripe.error import StripeError

from ..exceptions import PaymentError
from ..models import db
from .models import Payment, Subscription


class StripeService:
    """Service for handling Stripe payment operations."""

    def __init__(self) -> None:
        """Initialize Stripe service with API key."""
        self.stripe = stripe
        self.stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
        self.webhook_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

    def create_payment_intent(
        self,
        amount: Decimal,
        currency: str = "usd",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Create a payment intent for a one-time payment.

        Args:
            amount: Payment amount in dollars
            currency: Payment currency code
            metadata: Optional metadata for the payment intent

        Returns:
            Dict containing payment intent details

        Raises:
            PaymentError: If payment intent creation fails
        """
        try:
            intent = self.stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency.lower(),
                metadata=metadata or {},
            )
            return {
                "id": intent.id,
                "client_secret": intent.client_secret,
                "amount": amount,
                "currency": currency,
                "status": intent.status,
            }
        except StripeError as e:
            raise PaymentError(f"Error creating payment intent: {str(e)}")

    def create_subscription(
        self, customer_id: str, price_id: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a subscription for a customer.

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            metadata: Optional metadata for the subscription

        Returns:
            Dict containing subscription details

        Raises:
            PaymentError: If subscription creation fails
        """
        try:
            subscription = self.stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                metadata=metadata or {},
                expand=["latest_invoice.payment_intent"],
            )
            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "status": subscription.status,
            }
        except StripeError as e:
            raise PaymentError(f"Error creating subscription: {str(e)}")

    def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Create a new Stripe customer.

        Args:
            email: Customer email
            name: Optional customer name
            metadata: Optional metadata for the customer

        Returns:
            Dict containing customer details

        Raises:
            PaymentError: If customer creation fails
        """
        try:
            customer = self.stripe.Customer.create(
                email=email, name=name, metadata=metadata or {}
            )
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
            }
        except StripeError as e:
            raise PaymentError(f"Error creating customer: {str(e)}")

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True):
        """Cancel a subscription.

        Args:
            subscription_id: Stripe subscription ID
            at_period_end: Whether to cancel at period end

        Returns:
            Dict containing cancellation details

        Raises:
            PaymentError: If subscription cancellation fails
        """
        try:
            subscription = self.stripe.Subscription.modify(
                subscription_id, cancel_at_period_end=at_period_end
            )
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "cancel_at": subscription.cancel_at,
            }
        except StripeError as e:
            raise PaymentError(f"Error canceling subscription: {str(e)}")

    def handle_webhook(self, payload: bytes, sig_header: str):
        """Handle Stripe webhook events.

        Args:
            payload: Raw webhook payload
            sig_header: Stripe signature header

        Raises:
            PaymentError: If webhook handling fails
        """
        try:
            event = self.stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )

            if event.type == "payment_intent.succeeded":
                self._handle_payment_success(event.data.object)
            elif event.type == "payment_intent.payment_failed":
                self._handle_payment_failure(event.data.object)
            elif event.type == "customer.subscription.updated":
                self._handle_subscription_update(event.data.object)
            elif event.type == "customer.subscription.deleted":
                self._handle_subscription_deletion(event.data.object)

        except StripeError as e:
            raise PaymentError(f"Error handling webhook: {str(e)}")

    def _handle_payment_success(self, payment_intent: stripe.PaymentIntent) -> None:
        """Handle successful payment webhook event."""
        payment = Payment.query.filter_by(stripe_payment_id=payment_intent.id).first()
        if payment:
            payment.status = "completed"
            db.session.commit()

    def _handle_payment_failure(self, payment_intent: stripe.PaymentIntent):
        """Handle failed payment webhook event."""
        payment = Payment.query.filter_by(stripe_payment_id=payment_intent.id).first()
        if payment:
            payment.status = "failed"
            payment.error = (
                payment_intent.last_payment_error.message
                if payment_intent.last_payment_error
                else None
            )
            db.session.commit()

    def _handle_subscription_update(self, subscription: stripe.Subscription):
        """Handle subscription update webhook event."""
        sub = Subscription.query.filter_by(
            stripe_subscription_id=subscription.id
        ).first()
        if sub:
            sub.status = subscription.status
            db.session.commit()

    def _handle_subscription_deletion(self, subscription: stripe.Subscription):
        """Handle subscription deletion webhook event."""
        sub = Subscription.query.filter_by(
            stripe_subscription_id=subscription.id
        ).first()
        if sub:
            sub.status = "canceled"
            db.session.commit()
