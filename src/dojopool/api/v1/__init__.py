# API v1 initialization

from flask import Blueprint
from flask_restful import Api

from dojopool.api.v1.resources.wallet import (
    WalletResource,
    WalletStatsResource,
    WalletTransferResource,
    WalletTransactionResource,
)

api_v1_bp = Blueprint('api_v1', __name__)
api = Api(api_v1_bp)

# Register wallet endpoints
api.add_resource(WalletResource, '/wallet', '/wallet/<int:wallet_id>')
api.add_resource(WalletStatsResource, '/wallet/<int:wallet_id>/stats', '/wallet/stats')
api.add_resource(WalletTransferResource, '/wallet/transfer')
api.add_resource(WalletTransactionResource, '/wallet/<int:wallet_id>/transactions')
