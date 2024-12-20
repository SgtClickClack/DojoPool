from typing import List, Dict, Optional
from sqlalchemy.sql import func
from ..models import db, Rating, User, Venue, Tournament
from ..core.exceptions import ValidationError

class RatingService:
    @staticmethod
    def create_rating(user_id: int, target_type: str, target_id: int, 
                     rating: int, review: Optional[str] = None) -> Rating:
        """Create a new rating or update existing one."""
        # Validate rating value
        if not 1 <= rating <= 5:
            raise ValidationError("Rating must be between 1 and 5")
            
        # Check if target exists
        if target_type == 'venue':
            target = Venue.query.get(target_id)
        elif target_type == 'tournament':
            target = Tournament.query.get(target_id)
        elif target_type == 'player':
            target = User.query.get(target_id)
        else:
            raise ValidationError(f"Invalid target type: {target_type}")
            
        if not target:
            raise ValidationError(f"{target_type.capitalize()} not found")
            
        # Check for existing rating
        existing = Rating.query.filter_by(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id
        ).first()
        
        if existing:
            existing.rating = rating
            existing.review = review
            db.session.commit()
            return existing
            
        # Create new rating
        new_rating = Rating(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
            rating=rating,
            review=review
        )
        db.session.add(new_rating)
        db.session.commit()
        return new_rating
    
    @staticmethod
    def get_ratings(target_type: str, target_id: int, 
                   verified_only: bool = False) -> List[Dict]:
        """Get all ratings for a target."""
        query = Rating.query.filter_by(
            target_type=target_type,
            target_id=target_id
        )
        
        if verified_only:
            query = query.filter(Rating.is_verified == True)
            
        return [rating.to_dict() for rating in query.all()]
    
    @staticmethod
    def get_average_rating(target_type: str, target_id: int, 
                          verified_only: bool = False) -> Dict:
        """Get average rating and count for a target."""
        query = db.session.query(
            func.avg(Rating.rating).label('average'),
            func.count(Rating.id).label('count')
        ).filter_by(
            target_type=target_type,
            target_id=target_id
        )
        
        if verified_only:
            query = query.filter(Rating.is_verified == True)
            
        result = query.first()
        return {
            'average': float(result.average) if result.average else 0.0,
            'count': result.count
        }
    
    @staticmethod
    def delete_rating(rating_id: int, user_id: int) -> bool:
        """Delete a rating."""
        rating = Rating.query.get(rating_id)
        if not rating or rating.user_id != user_id:
            return False
            
        db.session.delete(rating)
        db.session.commit()
        return True 