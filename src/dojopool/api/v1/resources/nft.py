from flask import Blueprint, request, jsonify
from dojopool.services.nft_service import NftService

nft_bp = Blueprint('nft', __name__, url_prefix='/nft')
service = NftService()

@nft_bp.route('/list', methods=['GET'])
def list_user_nfts():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    nfts = service.list_user_nfts(user_id)
    return jsonify({'nfts': nfts})

@nft_bp.route('/transfer', methods=['POST'])
def transfer_nft():
    data = request.get_json()
    sender_user_id = data.get('sender_user_id')
    recipient_user_id = data.get('recipient_user_id')
    nft_id = data.get('nft_id')
    if not (sender_user_id and recipient_user_id and nft_id):
        return jsonify({'error': 'sender_user_id, recipient_user_id, and nft_id required'}), 400
    success = service.transfer_nft(sender_user_id, recipient_user_id, nft_id)
    return jsonify({'success': success}) 