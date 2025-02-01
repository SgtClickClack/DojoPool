from flask import Blueprint, jsonify, request

from ..auth.decorators import login_required
from ..models import db
from .models import Payment, PricingPlan, Subscription
from .stripe_service import StripeService

payments_bp = Blueprint("payments", __name__)
stripe_service = StripeService()


@payments_bp.route("/create-payment-intent", methods=["POST"])
@login_required
def create_payment_intent():
    """Create a payment intent for a one-time payment."""
    try:
        data = request.get_json()
        amount = data.get("amount")
        currency = data.get("currency", "USD")

        if not amount:
            return jsonify({"error": "Amount is required"}), 400

        result = stripe_service.create_payment_intent(amount, currency)

        # Create payment record
        payment = Payment(
            user_id=request.user.id,
            amount=amount,
            currency=currency,
            stripe_payment_id=result["id"],
            status="pending",
            payment_type="one_time",
        )
        db.session.add(payment)
        db.session.commit()

        return jsonify({"clientSecret": result["client_secret"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/create-subscription", methods=["POST"])
@login_required
def create_subscription():
    """Create a subscription for the current user."""
    try:
        data = request.get_json()
        price_id = data.get("priceId")

        if not price_id:
            return jsonify({"error": "Price ID is required"}), 400

        # Get or create customer
        if not request.user.stripe_customer_id:
            customer = stripe_service.create_customer(
                email=request.user.email, name=request.user.username
            )
            request.user.stripe_customer_id = customer["customer_id"]
            db.session.commit()

        result = stripe_service.create_subscription(request.user.stripe_customer_id, price_id)

        # Create subscription record
        subscription = Subscription(
            user_id=request.user.id,
            stripe_subscription_id=result["subscription_id"],
            status=result["status"],
            plan_type=price_id,  # You might want to map this to a friendly name
        )
        db.session.add(subscription)
        db.session.commit()

        return jsonify(
            {"clientSecret": result["client_secret"], "subscriptionId": result["subscription_id"]}
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/cancel-subscription", methods=["POST"])
@login_required
def cancel_subscription():
    """Cancel the user's subscription."""
    try:
        data = request.get_json()
        subscription_id = data.get("subscriptionId")

        if not subscription_id:
            return jsonify({"error": "Subscription ID is required"}), 400

        result = stripe_service.cancel_subscription(subscription_id)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/pricing-plans", methods=["GET"])
def get_pricing_plans():
    """Get all active pricing plans."""
    try:
        plans = PricingPlan.query.filter_by(is_active=True).all()
        return jsonify(
            {
                "plans": [
                    {
                        "id": plan.id,
                        "name": plan.name,
                        "amount": plan.amount,
                        "currency": plan.currency,
                        "interval": plan.interval,
                        "features": plan.features,
                        "stripe_price_id": plan.stripe_price_id,
                    }
                    for plan in plans
                ]
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/webhook", methods=["POST"])
def webhook():
    """Handle Stripe webhooks."""
    try:
        payload = request.get_data()
        sig_header = request.headers.get("Stripe-Signature")

        stripe_service.handle_webhook(payload, sig_header)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
