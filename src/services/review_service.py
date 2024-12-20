from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy import func
from src.extensions import db
from src.models.review import Review, ReviewResponse, ReviewReport, ReviewVote
from src.models.rating import Rating
from src.exceptions import ValidationError

class ReviewService:
    @staticmethod
    def create_review(rating_id: int, content: str) -> Review:
        """Create a new review for a rating."""
        rating = Rating.query.get(rating_id)
        if not rating:
            raise ValidationError("Rating not found")
            
        if Review.query.filter_by(rating_id=rating_id).first():
            raise ValidationError("Review already exists for this rating")
            
        review = Review(
            rating_id=rating_id,
            content=content
        )
        db.session.add(review)
        db.session.commit()
        return review
    
    @staticmethod
    def update_review(review_id: int, content: str) -> Review:
        """Update an existing review."""
        review = Review.query.get(review_id)
        if not review:
            raise ValidationError("Review not found")
            
        review.content = content
        review.updated_at = datetime.utcnow()
        db.session.commit()
        return review
    
    @staticmethod
    def moderate_review(review_id: int, status: str) -> Review:
        """Moderate a review (approve/reject)."""
        if status not in ['approved', 'rejected']:
            raise ValidationError("Invalid status")
            
        review = Review.query.get(review_id)
        if not review:
            raise ValidationError("Review not found")
            
        review.status = status
        db.session.commit()
        return review
    
    @staticmethod
    def add_response(review_id: int, user_id: int, content: str) -> ReviewResponse:
        """Add a response to a review."""
        review = Review.query.get(review_id)
        if not review:
            raise ValidationError("Review not found")
            
        response = ReviewResponse(
            review_id=review_id,
            user_id=user_id,
            content=content
        )
        db.session.add(response)
        db.session.commit()
        return response
    
    @staticmethod
    def report_review(review_id: int, user_id: int, reason: str, details: Optional[str] = None) -> ReviewReport:
        """Report a review for moderation."""
        review = Review.query.get(review_id)
        if not review:
            raise ValidationError("Review not found")
            
        existing_report = ReviewReport.query.filter_by(
            review_id=review_id,
            user_id=user_id,
            status='pending'
        ).first()
        if existing_report:
            raise ValidationError("You have already reported this review")
            
        report = ReviewReport(
            review_id=review_id,
            user_id=user_id,
            reason=reason,
            details=details
        )
        db.session.add(report)
        db.session.commit()
        return report
    
    @staticmethod
    def vote_review(review_id: int, user_id: int, is_helpful: bool) -> ReviewVote:
        """Vote on a review's helpfulness."""
        review = Review.query.get(review_id)
        if not review:
            raise ValidationError("Review not found")
            
        existing_vote = ReviewVote.query.filter_by(
            review_id=review_id,
            user_id=user_id
        ).first()
        
        if existing_vote:
            if existing_vote.is_helpful != is_helpful:
                # Update vote and adjust counts
                if is_helpful:
                    review.unhelpful_votes -= 1
                    review.helpful_votes += 1
                else:
                    review.helpful_votes -= 1
                    review.unhelpful_votes += 1
                existing_vote.is_helpful = is_helpful
                db.session.commit()
                return existing_vote
            raise ValidationError("You have already voted on this review")
            
        vote = ReviewVote(
            review_id=review_id,
            user_id=user_id,
            is_helpful=is_helpful
        )
        
        # Update review vote counts
        if is_helpful:
            review.helpful_votes += 1
        else:
            review.unhelpful_votes += 1
            
        db.session.add(vote)
        db.session.commit()
        return vote
    
    @staticmethod
    def get_review_analytics(target_type: str, target_id: int) -> dict:
        """Get analytics for reviews of a specific target."""
        reviews = Review.query.join(Rating).filter(
            Rating.target_type == target_type,
            Rating.target_id == target_id,
            Review.status == 'approved'
        )
        
        total_reviews = reviews.count()
        avg_helpfulness = db.session.query(
            func.avg(Review.helpful_votes / (Review.helpful_votes + Review.unhelpful_votes))
        ).filter(Review.helpful_votes + Review.unhelpful_votes > 0).scalar() or 0
        
        return {
            'total_reviews': total_reviews,
            'avg_helpfulness': float(avg_helpfulness),
            'verified_reviews': reviews.filter(Review.is_verified).count(),
            'response_rate': reviews.filter(ReviewResponse.review_id != None).count() / total_reviews if total_reviews > 0 else 0
        } 