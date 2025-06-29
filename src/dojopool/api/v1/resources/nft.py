from flask import Blueprint, request, jsonify
from dojopool.services.nft_service import NftService

nft_bp = Blueprint('nft', __name__, url_prefix='/nft')
service = NftService()

@nft_bp.route('/nfts', methods=['GET'])
def get_nfts():
    user_id = request.args.get('user_id')
    if not user_id:
        return {'error': 'user_id required'}, 400
    try:
        user_id_int = int(user_id)
    except ValueError:
        return {'error': 'user_id must be an integer'}, 400
    nfts = service.list_user_nfts(user_id_int)
    return jsonify({'nfts': nfts}), 200

@nft_bp.route('/nfts/transfer', methods=['POST'])
def transfer_nft():
    data = request.json
    if not data:
        return {'error': 'Missing JSON body'}, 400
    sender_user_id = data.get('sender_user_id')
    recipient_user_id = data.get('recipient_user_id')
    nft_id = data.get('nft_id')
    if not sender_user_id or not recipient_user_id or not nft_id:
        return {'error': 'sender_user_id, recipient_user_id, and nft_id required'}, 400
    success = service.transfer_nft(sender_user_id, recipient_user_id, nft_id)
    return {'success': success}, 200 