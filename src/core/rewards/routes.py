from flask import Blueprint, request, jsonify
from ..auth.decorators import login_required, admin_required
from .service import RewardsService

rewards_bp = Blueprint('rewards', __name__)
rewards_service = RewardsService()

# Reward Tier Routes
@rewards_bp.route('/tiers', methods=['POST'])
@admin_required
def create_tier():
    """Create a new reward tier."""
    try:
        data = request.get_json()
        tier = rewards_service.create_tier(data)
        return jsonify({
            'id': tier.id,
            'name': tier.name,
            'points_required': tier.points_required,
            'benefits': tier.benefits
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@rewards_bp.route('/tiers', methods=['GET'])
def get_tiers():
    """Get all active reward tiers."""
    tiers = rewards_service.get_active_tiers()
    return jsonify({
        'tiers': [{
            'id': tier.id,
            'name': tier.name,
            'description': tier.description,
            'points_required': tier.points_required,
            'benefits': tier.benefits
        } for tier in tiers]
    })

@rewards_bp.route('/tiers/<int:tier_id>', methods=['GET'])
def get_tier(tier_id):
    """Get a specific reward tier."""
    tier = rewards_service.get_tier(tier_id)
    if not tier:
        return jsonify({'error': 'Tier not found'}), 404
        
    return jsonify({
        'id': tier.id,
        'name': tier.name,
        'description': tier.description,
        'points_required': tier.points_required,
        'benefits': tier.benefits
    })

# Reward Routes
@rewards_bp.route('/rewards', methods=['POST'])
@admin_required
def create_reward():
    """Create a new reward."""
    try:
        data = request.get_json()
        reward = rewards_service.create_reward(data)
        return jsonify({
            'id': reward.id,
            'name': reward.name,
            'points_cost': reward.points_cost,
            'tier_id': reward.tier_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@rewards_bp.route('/rewards/available', methods=['GET'])
@login_required
def get_available_rewards():
    """Get available rewards for the current user."""
    user_id = request.user.id  # Assuming user is attached to request by auth decorator
    rewards = rewards_service.get_available_rewards(user_id)
    return jsonify({'rewards': rewards})

# User Reward Routes
@rewards_bp.route('/rewards/claim/<int:reward_id>', methods=['POST'])
@login_required
def claim_reward(reward_id):
    """Claim a reward for the current user."""
    user_id = request.user.id
    user_reward = rewards_service.claim_reward(user_id, reward_id)
    
    if not user_reward:
        return jsonify({'error': 'Unable to claim reward'}), 400
        
    return jsonify({
        'id': user_reward.id,
        'reward_id': user_reward.reward_id,
        'claimed_at': user_reward.claimed_at.isoformat(),
        'status': user_reward.status,
        'points_spent': user_reward.points_spent
    }), 201

@rewards_bp.route('/rewards/use/<int:user_reward_id>', methods=['POST'])
@login_required
def use_reward(user_reward_id):
    """Mark a reward as used."""
    success = rewards_service.use_reward(user_reward_id)
    if not success:
        return jsonify({'error': 'Unable to use reward'}), 400
        
    return jsonify({'message': 'Reward marked as used'})

@rewards_bp.route('/rewards/my-rewards', methods=['GET'])
@login_required
def get_my_rewards():
    """Get all rewards claimed by the current user."""
    user_id = request.user.id
    rewards = rewards_service.get_user_rewards(user_id)
    return jsonify({'rewards': rewards}) 