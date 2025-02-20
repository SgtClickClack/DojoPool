from datetime import datetime
from typing import Any, Dict, List, Optional

from models.match import Match
from models.shot import Shot
from models.user import User
from models.venue import Venue
from services.performance_tracking_service import PerformanceTrackingService
from services.shot_analysis import ShotAnalysis
from utils.validation import validate_offline_sync_data


class OfflineSyncService:
    def __init__(self):
        self.shot_analysis = ShotAnalysis()
        self.performance_tracking = PerformanceTrackingService()

    def sync_offline_data(
        self, user_id: str, offline_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synchronize offline data with server
        """
        # Validate offline data
        validation = validate_offline_sync_data(offline_data)
        if validation.get("error"):
            return validation

        # Process matches
        processed_matches = self._process_matches(
            user_id, offline_data.get("matches", [])
        )

        # Process shots
        processed_shots = self._process_shots(user_id, offline_data.get("shots", []))

        # Process venue check-ins
        processed_checkins = self._process_checkins(
            user_id, offline_data.get("checkins", [])
        )

        # Get updated user data
        user = User.get_by_id(user_id)
        if not user:
            return {"error": "User not found"}

        return {
            "status": "success",
            "timestamp": datetime.utcnow(),
            "sync_results": {
                "matches": processed_matches,
                "shots": processed_shots,
                "checkins": processed_checkins,
            },
            "user_data": {
                "profile": user.to_dict(),
                "performance": self.performance_tracking.track_player_performance(
                    user_id
                ),
            },
        }

    def get_sync_data(
        self, user_id: str, last_sync: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get data for offline storage
        """
        # Get user data
        user = User.get_by_id(user_id)
        if not user:
            return {"error": "User not found"}

        # Get matches since last sync
        matches = Match.get_user_matches_since(user_id, last_sync)

        # Get shots since last sync
        shots = Shot.get_user_shots_since(user_id, last_sync)

        # Get venues
        venues = Venue.get_user_venues(user_id)

        return {
            "timestamp": datetime.utcnow(),
            "user": user.to_dict(),
            "data": {
                "matches": [m.to_dict() for m in matches],
                "shots": [s.to_dict() for s in shots],
                "venues": [v.to_dict() for v in venues],
            },
            "performance": self.performance_tracking.track_player_performance(user_id),
        }

    def _process_matches(self, user_id: str, matches: List[Dict[str, Any]]):
        """
        Process offline matches
        """
        processed = {"success": [], "failed": []}

        for match_data in matches:
            try:
                # Validate match data
                if match_data.get("player1_id") != user_id:
                    processed["failed"].append(
                        {"match_data": match_data, "error": "Invalid player1_id"}
                    )
                    continue

                # Create or update match
                match = Match.create_or_update(match_data)
                if match:
                    processed["success"].append(match.to_dict())
                else:
                    processed["failed"].append(
                        {"match_data": match_data, "error": "Match creation failed"}
                    )

            except Exception as e:
                processed["failed"].append({"match_data": match_data, "error": str(e)})

        return processed

    def _process_shots(self, user_id: str, shots: List[Dict[str, Any]]):
        """
        Process offline shots
        """
        processed = {"success": [], "failed": []}

        for shot_data in shots:
            try:
                # Validate shot data
                if shot_data.get("player_id") != user_id:
                    processed["failed"].append(
                        {"shot_data": shot_data, "error": "Invalid player_id"}
                    )
                    continue

                # Create shot and analyze
                shot = Shot.create_or_update(shot_data)
                if shot:
                    analysis = self.shot_analysis.analyze_shot(shot.to_dict())
                    processed["success"].append(
                        {"shot": shot.to_dict(), "analysis": analysis}
                    )
                else:
                    processed["failed"].append(
                        {"shot_data": shot_data, "error": "Shot creation failed"}
                    )

            except Exception as e:
                processed["failed"].append({"shot_data": shot_data, "error": str(e)})

        return processed

    def _process_checkins(self, user_id: str, checkins: List[Dict[str, Any]]):
        """
        Process offline venue check-ins
        """
        processed = {"success": [], "failed": []}

        for checkin_data in checkins:
            try:
                # Get venue
                venue = Venue.get_by_id(checkin_data.get("venue_id"))
                if not venue:
                    processed["failed"].append(
                        {"checkin_data": checkin_data, "error": "Venue not found"}
                    )
                    continue

                # Process check-in
                if venue.process_offline_checkin(
                    {
                        "user_id": user_id,
                        "timestamp": checkin_data.get("timestamp"),
                        **checkin_data,
                    }
                ):
                    processed["success"].append(
                        {
                            "venue_id": venue.id,
                            "timestamp": checkin_data.get("timestamp"),
                        }
                    )
                else:
                    processed["failed"].append(
                        {
                            "checkin_data": checkin_data,
                            "error": "Check-in processing failed",
                        }
                    )

            except Exception as e:
                processed["failed"].append(
                    {"checkin_data": checkin_data, "error": str(e)}
                )

        return processed
