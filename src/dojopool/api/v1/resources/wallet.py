"""Wallet API endpoints."""

from flask import jsonify, request, current_app, g
from flask_login import login_required, current_user
from functools import wraps
import time

from dojopool.extensions import db, cache
from dojopool.services.wallet_service import WalletService, RewardType
from dojopool.core.exceptions import WalletError, InsufficientFundsError
from dojopool.api.v1.resources.base import BaseResource
from dojopool.core.security import require_auth


def cache_wallet_stats(timeout=300):
    """Cache decorator for wallet stats.

    Args:
        timeout: Cache timeout in seconds (default 5 minutes)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Generate cache key based on wallet_id and user
            wallet_id = kwargs.get('wallet_id')
            user_id = g.user_id if g.user_id else None
            cache_key = f'wallet_stats:{wallet_id}:{user_id}'

            # Try to get from cache first
            cached_stats = cache.get(cache_key)
            if cached_stats is not None:
                return cached_stats

            # If not in cache, call the function
            result = f(*args, **kwargs)

            # Cache the result if it's a successful response
            if isinstance(result, tuple) and result[1] == 200:
                cache.set(cache_key, result, timeout=timeout)

            return result
        return decorated_function
    return decorator


class WalletResource(BaseResource):
    """Wallet resource."""

    def __init__(self):
        """Initialize the wallet resource."""
        self.wallet_service = WalletService()

    @require_auth
    def get(self, wallet_id=None):
        """Get wallet details.

        Args:
            wallet_id: Optional wallet ID. If not provided, returns current user's wallet.

        Returns:
            Wallet details.
        """
        try:
            if wallet_id:
                # Only admins can view other wallets
                if not current_user.is_admin:
                    return {"error": "Unauthorized"}, 403
                wallet = self.wallet_service.get_wallet(wallet_id)
            else:
                # Use g.user_id from the require_auth decorator
                wallet = self.wallet_service.get_user_wallet(g.user_id)

            if not wallet:
                # Always return a default wallet object if not found
                return {
                    "id": None,
                    "user_id": g.user_id,
                    "balance": 0,
                    "transactions": [],
                    "rewards": 0
                }

            return wallet.to_dict()

        except Exception as e:
            return {"error": str(e)}, 500


class WalletTransactionResource(BaseResource):
    """Wallet transaction resource."""

    def __init__(self):
        """Initialize the wallet transaction resource."""
        self.wallet_service = WalletService()

    @login_required
    def get(self, wallet_id):
        """Get wallet transaction history.

        Args:
            wallet_id: The wallet ID.

        Returns:
            List of transactions.
        """
        try:
            # Check authorization
            wallet = self.wallet_service.get_wallet(wallet_id)
            if not wallet:
                return {"error": "Wallet not found"}
            if wallet.user_id != g.user_id and not current_user.is_admin:
                return {"error": "Unauthorized"}

            # Get query parameters
            limit = request.args.get("limit", 100, type=int)
            start_date = request.args.get("start_date", type=str)
            end_date = request.args.get("end_date", type=str)

            transactions = self.wallet_service.get_transaction_history(
                wallet_id,
                limit=limit
            )

            return jsonify([{
                "id": t.id,
                "wallet_id": t.wallet_id,
                "user_id": t.user_id,
                "amount": t.amount,
                "currency": t.currency,
                "type": t.type,
                "status": t.status,
                "description": t.description,
                "reference_id": t.reference_id,
                "created_at": t.created_at.isoformat() if t.created_at else None
            } for t in transactions])

        except Exception as e:
            return {"error": str(e)}


class WalletTransferResource(BaseResource):
    """Wallet transfer resource."""

    def __init__(self):
        """Initialize the wallet transfer resource."""
        self.wallet_service = WalletService()

    @login_required
    def post(self):
        """Transfer coins between users.

        Returns:
            The created transaction.
        """
        try:
            data = request.get_json()
            if not data:
                return {"error": "No data provided"}

            recipient_id = data.get("recipient_id")
            amount = data.get("amount")
            description = data.get("description")

            if not recipient_id or not amount:
                return {"error": "Missing required fields"}

            if amount <= 0:
                return {"error": "Amount must be positive"}

            transaction = self.wallet_service.transfer_coins(
                g.user_id,
                recipient_id,
                amount,
                description
            )

            return jsonify({
                "id": transaction.id,
                "wallet_id": transaction.wallet_id,
                "user_id": transaction.user_id,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "type": transaction.type,
                "status": transaction.status,
                "description": transaction.description,
                "reference_id": transaction.reference_id,
                "created_at": transaction.created_at.isoformat() if transaction.created_at else None
            })

        except InsufficientFundsError as e:
            return {"error": str(e)}
        except WalletError as e:
            return {"error": str(e)}
        except Exception as e:
            return {"error": str(e)}


class WalletStatsResource(BaseResource):
    """Wallet statistics resource."""

    def __init__(self):
        """Initialize the wallet stats resource."""
        self.wallet_service = WalletService()

    @require_auth
    @cache_wallet_stats(timeout=300)  # Cache for 5 minutes
    def get(self, wallet_id=None):
        """Get wallet statistics.
        Args:
            wallet_id: The wallet ID (optional).
        Returns:
            Wallet statistics.
        """
        try:
            # Handle unauthenticated users
            if not g.user_id:
                return jsonify({
                    "balance": 0,
                    "totalTransactions": 0,
                    "totalVolume": 0,
                    "totalIncoming": 0,
                    "totalOutgoing": 0,
                    "rewards": 0,
                    "transactions": []
                })

            # Get wallet
            if wallet_id is None:
                wallet = self.wallet_service.get_user_wallet(g.user_id)
                if not wallet:
                    return {
                        "balance": 0,
                        "totalTransactions": 0,
                        "totalVolume": 0,
                        "totalIncoming": 0,
                        "totalOutgoing": 0,
                        "rewards": 0,
                        "transactions": []
                    }
                wallet_id = wallet.id
            else:
                wallet = self.wallet_service.get_wallet(wallet_id)
                if not wallet:
                    return {"error": "Wallet not found"}
                if wallet.user_id != g.user_id and not current_user.is_admin:
                    return {"error": "Unauthorized"}

            # Get stats from service
            stats = self.wallet_service.get_wallet_stats(wallet_id)
            return jsonify(stats)

        except WalletError as e:
            return {"error": str(e)}
        except Exception as e:
            return {"error": str(e)}, 500