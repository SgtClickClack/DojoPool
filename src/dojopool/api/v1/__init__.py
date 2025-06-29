# API v1 initialization

from flask import Blueprint
from flask_restful import Api

from dojopool.api.v1.resources.profile import ProfileResource
from dojopool.api.v1.resources.tournaments import TournamentListResource
from dojopool.api.v1.resources.venues import VenuesResource
from dojopool.api.v1.resources.wallet import WalletResource, WalletStatsResource, WalletTransferResource, WalletTransactionResource
from dojopool.api.v1.resources.user_me import UserMeResource
from dojopool.api.v1.resources.users import UserResource, UserListResource
from dojopool.api.v1.resources.feed import FeedResource
from dojopool.api.v1.resources.games import GameListResource, GameDetailResource

api_v1_bp = Blueprint('api_v1', __name__)
api = Api(api_v1_bp)

# Register wallet endpoints
api.add_resource(WalletResource, '/wallet', '/wallet/<int:wallet_id>')
api.add_resource(WalletStatsResource, '/wallet/<int:wallet_id>/stats', '/wallet/stats')
api.add_resource(WalletTransferResource, '/wallet/transfer')
api.add_resource(WalletTransactionResource, '/wallet/<int:wallet_id>/transactions')

# Register user endpoints
api.add_resource(UserMeResource, '/users/me')
api.add_resource(UserResource, '/users/<int:user_id>')
api.add_resource(UserListResource, '/users')

# Register profile endpoint
api.add_resource(ProfileResource, '/profile')

# Register tournament endpoints
api.add_resource(TournamentListResource, '/tournaments')

# Register venues endpoint
api.add_resource(VenuesResource, '/venues')

# Register feed endpoint
api.add_resource(FeedResource, '/feed')

# Register game endpoints
api.add_resource(GameListResource, '/games')
api.add_resource(GameDetailResource, '/games/<int:game_id>')
