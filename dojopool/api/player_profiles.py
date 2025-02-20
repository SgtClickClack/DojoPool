"""
FastAPI endpoints for professional player profiles.
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from ..auth.dependencies import get_current_user, require_admin
from ..models.user import User
from ..services.tournaments.player_profile_service import (
    Achievement,
    CareerHighlight,
    Certification,
    Equipment,
    PlayerProfile,
    PlayerProfileService,
    PlayerStatus,
    PlayingStyle,
    Sponsorship,
)

router = APIRouter(prefix="/api/players", tags=["players"])

# Initialize services
profile_service = PlayerProfileService()


# Request/Response Models
class CreateProfileRequest(BaseModel):
    """Request model for creating a player profile."""

    first_name: str
    last_name: str
    nationality: str
    date_of_birth: datetime
    professional_since: datetime
    playing_style: PlayingStyle
    dominant_hand: str
    bio: str
    equipment: Equipment
    nickname: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    profile_image_url: Optional[str] = None


class ProfileResponse(BaseModel):
    """Response model for player profile."""

    player_id: str
    first_name: str
    last_name: str
    nickname: Optional[str]
    nationality: str
    status: PlayerStatus
    playing_style: PlayingStyle
    bio: str
    achievements: List[Achievement]
    career_highlights: List[CareerHighlight]
    equipment: Equipment
    sponsorships: List[Sponsorship]
    social_media: Dict[str, str]
    profile_image_url: Optional[str]
    verified: bool
    last_updated: datetime


class AchievementRequest(BaseModel):
    """Request model for adding an achievement."""

    title: str
    description: str
    tournament_id: Optional[str]
    venue_id: Optional[str]
    proof_url: Optional[str]


class CertificationRequest(BaseModel):
    """Request model for adding a certification."""

    name: str
    issuing_body: str
    level: str
    verification_url: Optional[str]
    expiry_date: Optional[datetime]


class SponsorshipRequest(BaseModel):
    """Request model for adding a sponsorship."""

    sponsor_name: str
    type: str
    details: Dict[str, any]
    end_date: Optional[datetime]


# Profile Management Endpoints
@router.post("/create", response_model=ProfileResponse)
async def create_player_profile(
    request: CreateProfileRequest, current_user: User = Depends(get_current_user)
) -> Dict:
    """Create a new professional player profile."""
    try:
        profile = profile_service.create_profile(
            player_id=current_user.id,
            first_name=request.first_name,
            last_name=request.last_name,
            nationality=request.nationality,
            date_of_birth=request.date_of_birth,
            professional_since=request.professional_since,
            playing_style=request.playing_style,
            dominant_hand=request.dominant_hand,
            bio=request.bio,
            equipment=request.equipment,
            nickname=request.nickname,
            social_media=request.social_media or {},
            profile_image_url=request.profile_image_url,
        )
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}", response_model=ProfileResponse)
async def get_player_profile(
    player_id: str,
    include_stats: bool = False,
    include_ranking: bool = False,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get a player's profile."""
    result = profile_service.get_profile(
        player_id, include_stats=include_stats, include_ranking=include_ranking
    )
    if not result:
        raise HTTPException(status_code=404, detail="Player profile not found")
    return result


@router.patch("/{player_id}")
async def update_player_profile(
    player_id: str, updates: Dict, current_user: User = Depends(get_current_user)
) -> Dict:
    """Update a player's profile."""
    if current_user.id != player_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this profile"
        )

    try:
        profile = profile_service.update_profile(player_id, updates)
        return {"status": "success", "profile": profile}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Achievement and Certification Endpoints
@router.post("/{player_id}/achievements")
async def add_achievement(
    player_id: str,
    achievement: AchievementRequest,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Add an achievement to player's profile."""
    if current_user.id != player_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to add achievements"
        )

    try:
        success = profile_service.add_achievement(
            player_id,
            Achievement(
                title=achievement.title,
                description=achievement.description,
                date_achieved=datetime.now(),
                tournament_id=achievement.tournament_id,
                venue_id=achievement.venue_id,
                proof_url=achievement.proof_url,
            ),
        )
        return {"status": "success" if success else "failed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{player_id}/certifications")
async def add_certification(
    player_id: str,
    certification: CertificationRequest,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Add a certification to player's profile."""
    if current_user.id != player_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to add certifications"
        )

    try:
        success = profile_service.add_certification(
            player_id,
            Certification(
                name=certification.name,
                issuing_body=certification.issuing_body,
                issue_date=datetime.now(),
                expiry_date=certification.expiry_date,
                level=certification.level,
                verification_url=certification.verification_url,
            ),
        )
        return {"status": "success" if success else "failed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Sponsorship Management
@router.post("/{player_id}/sponsorships")
async def add_sponsorship(
    player_id: str,
    sponsorship: SponsorshipRequest,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Add a sponsorship to player's profile."""
    if current_user.id != player_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to add sponsorships"
        )

    try:
        success = profile_service.add_sponsorship(
            player_id,
            Sponsorship(
                sponsor_name=sponsorship.sponsor_name,
                start_date=datetime.now(),
                end_date=sponsorship.end_date,
                type=sponsorship.type,
                details=sponsorship.details,
            ),
        )
        return {"status": "success" if success else "failed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Profile Verification
@router.post("/{player_id}/verify")
async def verify_player_profile(
    player_id: str,
    verification_proof: Dict,
    current_user: User = Depends(require_admin),
) -> Dict:
    """Verify a player's professional profile."""
    try:
        success = profile_service.verify_player(player_id, verification_proof)
        return {"status": "success" if success else "failed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Profile Image Upload
@router.post("/{player_id}/image")
async def upload_profile_image(
    player_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Upload a profile image."""
    if current_user.id != player_id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to update profile image"
        )

    try:
        # Implement image upload logic here
        # Store file and get URL
        image_url = f"/static/profiles/{player_id}/{file.filename}"

        # Update profile with new image URL
        profile_service.update_profile(player_id, {"profile_image_url": image_url})

        return {"status": "success", "image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Search and Filtering
@router.get("/search")
async def search_players(
    name: Optional[str] = None,
    nationality: Optional[str] = None,
    status: Optional[PlayerStatus] = None,
    verified_only: bool = False,
    current_user: User = Depends(get_current_user),
) -> List[ProfileResponse]:
    """Search player profiles."""
    criteria = {}
    if name:
        # Implement name search logic
        pass
    if nationality:
        criteria["nationality"] = nationality
    if status:
        criteria["status"] = status

    profiles = profile_service.search_profiles(criteria)

    if verified_only:
        profiles = [p for p in profiles if p.verified]

    return profiles


@router.get("/active")
async def get_active_players(
    current_user: User = Depends(get_current_user),
) -> List[ProfileResponse]:
    """Get all active professional players."""
    return profile_service.get_active_players()


@router.get("/verified")
async def get_verified_players(
    current_user: User = Depends(get_current_user),
) -> List[ProfileResponse]:
    """Get all verified professional players."""
    return profile_service.get_verified_players()
