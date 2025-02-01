from typing import Dict, Optional

import stripe
from flask import current_app

from ..models import db
from .models import Payment, Subscription


class StripeService:
    def __init__(self):
        self.stripe = stripe
        self.stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    def create_payment_intent(self, amount: float, currency: str = "USD") -> Dict:
        """Create a payment intent for a one-time payment."""
        try:
            intent = self.stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
            )
            return {"client_secret": intent.client_secret, "id": intent.id}
        except stripe.error.StripeError as e:
            raise Exception(f"Error creating payment intent: {str(e)}")

    def create_subscription(self, customer_id: str, price_id: str) -> Dict:
        """Create a subscription for a customer."""
        try:
            subscription = self.stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"],
            )
            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "status": subscription.status,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Error creating subscription: {str(e)}")

    def create_customer(self, email: str, name: Optional[str] = None) -> Dict:
        """Create a new Stripe customer."""
        try:
            customer = self.stripe.Customer.create(email=email, name=name)
            return {"customer_id": customer.id}
        except stripe.error.StripeError as e:
            raise Exception(f"Error creating customer: {str(e)}")

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Dict:
        """Cancel a subscription."""
        try:
            subscription = self.stripe.Subscription.modify(
                subscription_id, cancel_at_period_end=at_period_end
            )
            return {
                "status": subscription.status,
                "cancel_at_period_end": subscription.cancel_at_period_end,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Error canceling subscription: {str(e)}")

    def handle_webhook(self, payload: Dict, sig_header: str) -> None:
        """Handle Stripe webhooks."""
        try:
            event = self.stripe.Webhook.construct_event(
                payload, sig_header, current_app.config["STRIPE_WEBHOOK_SECRET"]
            )

            if event.type == "payment_intent.succeeded":
                self._handle_payment_success(event.data.object)
            elif event.type == "payment_intent.payment_failed":
                self._handle_payment_failure(event.data.object)
            elif event.type == "customer.subscription.updated":
                self._handle_subscription_update(event.data.object)
            elif event.type == "customer.subscription.deleted":
                self._handle_subscription_deletion(event.data.object)

        except stripe.error.SignatureVerificationError:
            raise Exception("Invalid signature")
        except Exception as e:
            raise Exception(f"Error handling webhook: {str(e)}")

    def _handle_payment_success(self, payment_intent):
        """Handle successful payment."""
        payment = Payment.query.filter_by(stripe_payment_id=payment_intent.id).first()
        if payment:
            payment.status = "succeeded"
            db.session.commit()

    def _handle_payment_failure(self, payment_intent):
        """Handle failed payment."""
        payment = Payment.query.filter_by(stripe_payment_id=payment_intent.id).first()
        if payment:
            payment.status = "failed"
            db.session.commit()

    def _handle_subscription_update(self, subscription):
        """Handle subscription update."""
        sub = Subscription.query.filter_by(stripe_subscription_id=subscription.id).first()
        if sub:
            sub.status = subscription.status
            sub.current_period_end = subscription.current_period_end
            sub.cancel_at_period_end = subscription.cancel_at_period_end
            db.session.commit()

    def _handle_subscription_deletion(self, subscription):
        """Handle subscription deletion."""
        sub = Subscription.query.filter_by(stripe_subscription_id=subscription.id).first()
        if sub:
            sub.status = "canceled"
            db.session.commit()
