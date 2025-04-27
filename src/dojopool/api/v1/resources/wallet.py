"""Wallet API endpoints."""

from flask import jsonify, request
from flask_login import login_required, current_user

from dojopool.core.extensions import db
from dojopool.services.wallet_service import WalletService, RewardType
from dojopool.core.exceptions import WalletError, InsufficientFundsError
from dojopool.api.v1.resources.base import BaseResource


class WalletResource(BaseResource):
    """Wallet resource."""

    def __init__(self):
        """Initialize the wallet resource."""
        self.wallet_service = WalletService()

    @login_required
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
                wallet = self.wallet_service.get_user_wallet(current_user.id)

            if not wallet:
                return {"error": "Wallet not found"}, 404

            return jsonify({
                "id": wallet.id,
                "user_id": wallet.user_id,
                "balance": wallet.balance,
                "currency": wallet.currency,
                "is_active": wallet.is_active,
                "created_at": wallet.created_at.isoformat(),
                "updated_at": wallet.updated_at.isoformat() if wallet.updated_at else None
            })

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
                return {"error": "Wallet not found"}, 404
            if wallet.user_id != current_user.id and not current_user.is_admin:
                return {"error": "Unauthorized"}, 403

            # Get query parameters
            limit = request.args.get("limit", 100, type=int)
            start_date = request.args.get("start_date", type=str)
            end_date = request.args.get("end_date", type=str)

            transactions = self.wallet_service.get_transaction_history(
                wallet_id,
                start_date=start_date,
                end_date=end_date,
                limit=limit
            )

            return jsonify([{
                "id": t.id,
                "wallet_id": t.wallet_id,
                "transaction_type": t.transaction_type,
                "amount": t.amount,
                "description": t.description,
                "metadata": t.metadata,
                "created_at": t.created_at.isoformat()
            } for t in transactions])

        except Exception as e:
            return {"error": str(e)}, 500


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
                return {"error": "No data provided"}, 400

            recipient_id = data.get("recipient_id")
            amount = data.get("amount")
            description = data.get("description")

            if not recipient_id or not amount:
                return {"error": "Missing required fields"}, 400

            if amount <= 0:
                return {"error": "Amount must be positive"}, 400

            transaction = self.wallet_service.transfer_coins(
                current_user.id,
                recipient_id,
                amount,
                description
            )

            return jsonify({
                "id": transaction.id,
                "wallet_id": transaction.wallet_id,
                "transaction_type": transaction.transaction_type,
                "amount": transaction.amount,
                "description": transaction.description,
                "metadata": transaction.metadata,
                "created_at": transaction.created_at.isoformat()
            })

        except InsufficientFundsError as e:
            return {"error": str(e)}, 400
        except WalletError as e:
            return {"error": str(e)}, 404
        except Exception as e:
            return {"error": str(e)}, 500


class WalletStatsResource(BaseResource):
    """Wallet statistics resource."""

    def __init__(self):
        """Initialize the wallet stats resource."""
        self.wallet_service = WalletService()

    @login_required
    def get(self, wallet_id):
        """Get wallet statistics.
        
        Args:
            wallet_id: The wallet ID.
            
        Returns:
            Wallet statistics.
        """
        try:
            # Check authorization
            wallet = self.wallet_service.get_wallet(wallet_id)
            if not wallet:
                return {"error": "Wallet not found"}, 404
            if wallet.user_id != current_user.id and not current_user.is_admin:
                return {"error": "Unauthorized"}, 403

            stats = self.wallet_service.get_wallet_stats(wallet_id)
            return jsonify(stats)

        except WalletError as e:
            return {"error": str(e)}, 404
        except Exception as e:
            return {"error": str(e)}, 500 