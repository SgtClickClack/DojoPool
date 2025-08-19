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

    def get_tier(self, tier_id: int) -> Optional[RewardTier]:
        """Get a reward tier by ID."""
        return RewardTier.query.get(tier_id)

    def get_active_tiers(self) -> List[RewardTier]:
        """Get all active reward tiers."""
        return RewardTier.query.filter_by(is_active=True).all()

    def create_reward(self, data: Dict) -> Reward:
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
            user_id=user_id, reward_id=reward_id, status="claimed", points_spent=reward.points_cost
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

    def get_user_rewards(self, user_id: int) -> List[Dict]:
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

    def purchase_shop_item(self, user_id: int, item_id: int) -> bool:
        """Purchase an item from the rewards shop for a user."""
        user = User.query.get(user_id)
        shop_item = Reward.query.get(item_id) # Assuming shop items are also stored as Rewards

        # Validate user and item
        if not user or not shop_item:
            return False

        # Validate item availability (similar checks as claim_reward)
        # This assumes shop items are structured similarly to claimable rewards
        if not shop_item.is_active:
            return False

        # Check if item is expired (if applicable)
        if shop_item.expiry_date and shop_item.expiry_date < datetime.utcnow():
            return False

        # Check if item is out of stock (if applicable)
        if shop_item.quantity_available is not None:
            # Need to decide how shop item stock is tracked, perhaps a different status or model?
            # For now, using 'purchased' status if shop items use UserReward model
            purchased_count = UserReward.query.filter_by(
                reward_id=shop_item.id, status="purchased"
            ).count() # Assuming a 'purchased' status for shop items
            if purchased_count >= shop_item.quantity_available:
                return False

        # Check if user has enough points
        if user.points < shop_item.points_cost:
            return False

        # Process the purchase
        try:
            # Create a UserReward entry for the purchased item
            # Using status 'purchased' to differentiate from 'claimed'
            user_purchase = UserReward(
                user_id=user_id,
                reward_id=shop_item.id,
                status="purchased", # Use a distinct status for purchased items
                points_spent=shop_item.points_cost
            )

            # Deduct points from user
            user.points -= shop_item.points_cost

            db.session.add(user_purchase)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            print(f"Error processing purchase for item {item_id} by user {user_id}: {e}")
            return False
