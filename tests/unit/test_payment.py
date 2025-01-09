"""Test payment functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.payment import payment_service
from dojopool.models import User, Game, Match

def test_payment_creation():
    """Test creating a payment."""
    user = User(username="test_user", email="test@example.com")
    payment = payment_service.create_payment(
        user_id=user.id,
        amount=100.00,
        currency="USD",
        payment_method="credit_card"
    )
    
    assert payment.user_id == user.id
    assert payment.amount == 100.00
    assert payment.currency == "USD"
    assert payment.payment_method == "credit_card"

def test_payment_processing():
    """Test payment processing."""
    user = User(username="test_user", email="test@example.com")
    payment = payment_service.create_payment(
        user_id=user.id,
        amount=100.00,
        currency="USD",
        payment_method="credit_card"
    )
    
    result = payment_service.process_payment(payment)
    assert result.success is True
    assert result.transaction_id is not None

def test_payment_refund():
    """Test payment refund."""
    user = User(username="test_user", email="test@example.com")
    payment = payment_service.create_payment(
        user_id=user.id,
        amount=100.00,
        currency="USD",
        payment_method="credit_card"
    )
    
    payment_service.process_payment(payment)
    refund = payment_service.refund_payment(payment.id)
    
    assert refund.success is True
    assert refund.amount == payment.amount

def test_payment_history():
    """Test payment history retrieval."""
    user = User(username="test_user", email="test@example.com")
    
    # Create multiple payments
    for i in range(5):
        payment = payment_service.create_payment(
            user_id=user.id,
            amount=100.00 * (i + 1),
            currency="USD",
            payment_method="credit_card"
        )
        payment_service.process_payment(payment)
    
    history = payment_service.get_payment_history(user.id)
    assert len(history) == 5
    assert all(p.user_id == user.id for p in history)

def test_payment_methods():
    """Test payment method management."""
    user = User(username="test_user", email="test@example.com")
    
    # Add payment method
    payment_method = payment_service.add_payment_method(
        user_id=user.id,
        type="credit_card",
        details={
            "number": "4111111111111111",
            "expiry": "12/25",
            "cvv": "123"
        }
    )
    
    assert payment_method.type == "credit_card"
    assert payment_method.is_default is True
    
    # Get payment methods
    methods = payment_service.get_payment_methods(user.id)
    assert len(methods) == 1
    assert methods[0].id == payment_method.id

def test_payment_subscriptions():
    """Test payment subscriptions."""
    user = User(username="test_user", email="test@example.com")
    subscription = payment_service.create_subscription(
        user_id=user.id,
        plan_id="premium_monthly",
        payment_method_id="pm_123"
    )
    
    assert subscription.status == "active"
    assert subscription.plan_id == "premium_monthly"
    
    # Cancel subscription
    cancelled = payment_service.cancel_subscription(subscription.id)
    assert cancelled.status == "cancelled"

def test_payment_webhooks():
    """Test payment webhook handling."""
    webhook_data = {
        "type": "payment.succeeded",
        "data": {
            "payment_id": "py_123",
            "amount": 100.00,
            "currency": "USD"
        }
    }
    
    result = payment_service.handle_webhook(webhook_data)
    assert result.success is True
    assert result.event_type == "payment.succeeded"

def test_payment_disputes():
    """Test payment dispute handling."""
    user = User(username="test_user", email="test@example.com")
    payment = payment_service.create_payment(
        user_id=user.id,
        amount=100.00,
        currency="USD",
        payment_method="credit_card"
    )
    
    payment_service.process_payment(payment)
    
    # Create dispute
    dispute = payment_service.create_dispute(
        payment_id=payment.id,
        reason="product_not_received"
    )
    
    assert dispute.status == "open"
    assert dispute.payment_id == payment.id
    
    # Resolve dispute
    resolved = payment_service.resolve_dispute(dispute.id)
    assert resolved.status == "resolved"

def test_payment_analytics():
    """Test payment analytics."""
    start_date = datetime.utcnow() - timedelta(days=30)
    end_date = datetime.utcnow()
    
    analytics = payment_service.get_analytics(start_date, end_date)
    
    assert "total_revenue" in analytics
    assert "transaction_count" in analytics
    assert "average_transaction_value" in analytics
    assert "refund_rate" in analytics

def test_payment_currency_conversion():
    """Test payment currency conversion."""
    amount_usd = 100.00
    converted = payment_service.convert_currency(
        amount=amount_usd,
        from_currency="USD",
        to_currency="EUR"
    )
    
    assert converted.amount > 0
    assert converted.currency == "EUR"
    assert converted.exchange_rate > 0 