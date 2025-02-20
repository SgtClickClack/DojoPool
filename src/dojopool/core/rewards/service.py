from flask_caching import Cache
from flask_caching import Cache
from datetime import datetime
from typing import Dict, List, Optional

from ..models import User, db
from .models import Reward, RewardTier, UserReward


class RewardsService:
    def create_tier(self, data: Dict) -> RewardTier:
        """Create a new reward tier."""
        tier = RewardTier(
            name=data["name"],
            description=data.get("description"),
            points_required=data["points_required"],
            benefits=data.get("benefits", {}),
            is_active=True,
        )
        db.session.add(tier)
        db.session.commit()
        return tier

    def get_tier(self, tier_id: int):
        """Get a reward tier by ID."""
        return RewardTier.query.get(tier_id)

    def get_active_tiers(self):
        """Get all active reward tiers."""
        return RewardTier.query.filter_by(is_active=True).all()

    def create_reward(self, data: Dict):
        """Create a new reward."""
        reward = Reward(
            tier_id=data["tier_id"],
            name=data["name"],
            description=data.get("description"),
            points_cost=data["points_cost"],
            quantity_available=data.get("quantity_available"),
            is_active=True,
            expiry_date=data.get("expiry_date"),
        )
        db.session.add(reward)
        db.session.commit()
        return reward

    def get_available_rewards(self, user_id: int) -> List[Dict]:
        """Get available rewards for a user based on their points."""
        user = User.query.get(user_id)
        if not user:
            return []

        rewards = Reward.query.filter_by(is_active=True).all()
        available_rewards = []

        for reward in rewards:
            # Check if reward is expired
            if reward.expiry_date and reward.expiry_date < datetime.utcnow():
                continue

            # Check if reward is out of stock
            if reward.quantity_available is not None:
                claimed_count = UserReward.query.filter_by(
                    reward_id=reward.id, status="claimed"
                ).count()
                if claimed_count >= reward.quantity_available:
                    continue

            # Check if user has enough points
            if user.points >= reward.points_cost:
                available_rewards.append(
                    {
                        "id": reward.id,
                        "name": reward.name,
                        "description": reward.description,
                        "points_cost": reward.points_cost,
                        "tier": {"id": reward.tier.id, "name": reward.tier.name},
                    }
                )

        return available_rewards

    def claim_reward(self, user_id: int, reward_id: int) -> Optional[UserReward]:
        """Claim a reward for a user."""
        user = User.query.get(user_id)
        reward = Reward.query.get(reward_id)

        if not user or not reward:
            return None

        # Validate reward availability
        if not reward.is_active:
            return None

        if reward.expiry_date and reward.expiry_date < datetime.utcnow():
            return None

        if reward.quantity_available is not None:
            claimed_count = UserReward.query.filter_by(
                reward_id=reward.id, status="claimed"
            ).count()
            if claimed_count >= reward.quantity_available:
                return None

        # Check if user has enough points
        if user.points < reward.points_cost:
            return None

        # Create user reward
        user_reward = UserReward(
            user_id=user_id,
            reward_id=reward_id,
            status="claimed",
            points_spent=reward.points_cost,
        )

        # Deduct points from user
        user.points -= reward.points_cost

        db.session.add(user_reward)
        db.session.commit()
        return user_reward

    def use_reward(self, user_reward_id: int) -> bool:
        """Mark a reward as used."""
        user_reward = UserReward.query.get(user_reward_id)
        if not user_reward or user_reward.status != "claimed":
            return False

        user_reward.status = "used"
        user_reward.used_at = datetime.utcnow()
        db.session.commit()
        return True

    def get_user_rewards(self, user_id: int):
        """Get all rewards claimed by a user."""
        user_rewards = UserReward.query.filter_by(user_id=user_id).all()
        return [
            {
                "id": ur.id,
                "reward": {
                    "id": ur.reward.id,
                    "name": ur.reward.name,
                    "description": ur.reward.description,
                },
                "claimed_at": ur.claimed_at.isoformat(),
                "used_at": ur.used_at.isoformat() if ur.used_at else None,
                "status": ur.status,
                "points_spent": ur.points_spent,
            }
            for ur in user_rewards
        ]
