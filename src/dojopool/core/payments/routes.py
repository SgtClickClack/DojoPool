"""
Payment routes for DojoPool.
Handles payment-related HTTP endpoints.
"""

from typing import Any, Dict, List, Optional, Union

from flask import Blueprint, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response

from ..auth.decorators import require_auth
from ..exceptions import PaymentError
from ..models import Transaction, User
from .service import payment_service

payments_bp: Blueprint = Blueprint("payments", __name__, url_prefix="/payments")


@payments_bp.route("/methods", methods=["GET"])
@require_auth
def get_payment_methods() -> ResponseReturnValue:
    """Get user's payment methods."""
    try:
        methods = payment_service.get_payment_methods(request.user.id)
        return jsonify({"payment_methods": methods})
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400


@payments_bp.route("/methods", methods=["POST"])
@require_auth
def add_payment_method():
    """Add a new payment method."""
    try:
        data = request.get_json()
        if not data or "payment_method_id" not in data:
            return jsonify({"error": "Missing payment_method_id"}), 400

        method = payment_service.add_payment_method(
            request.user.id, data["payment_method_id"]
        )
        return jsonify({"payment_method": method})
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400


@payments_bp.route("/methods/<method_id>", methods=["DELETE"])
@require_auth
def remove_payment_method(method_id: str) -> ResponseReturnValue:
    """Remove a payment method."""
    try:
        payment_service.remove_payment_method(request.user.id, method_id)
        return jsonify({"message": "Payment method removed"})
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400


@payments_bp.route("/intent", methods=["POST"])
@require_auth
def create_payment_intent():
    """Create a payment intent."""
    try:
        data = request.get_json()
        if not data or "amount" not in data:
            return jsonify({"error": "Missing amount"}), 400

        intent = payment_service.create_payment_intent(
            request.user.id,
            data["amount"],
            data.get("currency", "usd"),
            data.get("payment_method_id"),
            data.get("metadata"),
        )
        return jsonify(intent)
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400


@payments_bp.route("/confirm", methods=["POST"])
@require_auth
def confirm_payment():
    """Confirm a payment intent."""
    try:
        data = request.get_json()
        if not data or "payment_intent_id" not in data:
            return jsonify({"error": "Missing payment_intent_id"}), 400

        result = payment_service.confirm_payment(
            data["payment_intent_id"], data.get("payment_method_id")
        )
        return jsonify(result)
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400


@payments_bp.route("/webhook", methods=["POST"])
def webhook():
    """Handle payment webhook events."""
    try:
        event_data = request.get_json()
        if not event_data:
            return jsonify({"error": "No event data"}), 400

        payment_service.process_webhook(event_data)
        return jsonify({"message": "Webhook processed"})
    except PaymentError as e:
        return jsonify({"error": str(e)}), 400
