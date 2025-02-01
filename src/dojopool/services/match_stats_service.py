"""Service for handling match statistics and score tracking."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from dojopool.core.extensions import db
from dojopool.models.tournament import MatchStatus, TournamentMatch, TournamentParticipant


class MatchStatsService:
    """Service for tracking match statistics and scores."""

    @staticmethod
    def record_score(match_id: int, score_data: Dict[str, Any]) -> Optional[TournamentMatch]:
        """Record the score for a match.

        Args:
            match_id: Match ID
            score_data: Score data including:
                - frames: List of frame results
                - winner_id: ID of the winning participant
                - stats: Additional statistics (breaks, safeties, etc.)

        Returns:
            Optional[TournamentMatch]: Updated match if found
        """
        match = TournamentMatch.query.get(match_id)
        if not match:
            return None

        # Validate players
        if not match.player1_id or not match.player2_id:
            raise ValueError("Match must have two players assigned")

        # Validate winner
        winner_id = score_data.get("winner_id")
        if winner_id not in [match.player1_id, match.player2_id]:
            raise ValueError("Winner must be one of the match participants")

        # Record frame results
        frames = score_data.get("frames", [])
        score = {
            "frames": frames,
            "final_score": f"{frames.count(match.player1_id)}-{frames.count(match.player2_id)}",
        }

        # Update match
        match.score = score
        match.winner_id = winner_id
        match.status = MatchStatus.COMPLETED
        match.end_time = datetime.utcnow()

        # Record statistics
        stats = score_data.get("stats", {})
        match.stats = {
            "breaks": stats.get("breaks", []),
            "safeties": stats.get("safeties", []),
            "fouls": stats.get("fouls", []),
            "duration": stats.get("duration"),
            "shots": stats.get("shots", []),
        }

        # Update participant statistics
        MatchStatsService._update_participant_stats(match)

        db.session.commit()
        return match

    @staticmethod
    def _update_participant_stats(match: TournamentMatch) -> None:
        """Update statistics for match participants.

        Args:
            match: Tournament match
        """
        for participant in [match.player1, match.player2]:
            if not participant:
                continue

            # Initialize stats if needed
            if not participant.stats:
                participant.stats = {
                    "matches_played": 0,
                    "matches_won": 0,
                    "frames_played": 0,
                    "frames_won": 0,
                    "total_breaks": 0,
                    "highest_break": 0,
                    "average_break": 0,
                    "total_fouls": 0,
                }

            # Update match counts
            participant.stats["matches_played"] += 1
            if match.winner_id == participant.id:
                participant.stats["matches_won"] += 1

            # Update frame counts
            frames = match.score.get("frames", [])
            participant.stats["frames_played"] += len(frames)
            participant.stats["frames_won"] += frames.count(participant.id)

            # Update break statistics
            breaks = [
                b["points"]
                for b in match.stats.get("breaks", [])
                if b["player_id"] == participant.id
            ]
            if breaks:
                participant.stats["total_breaks"] += len(breaks)
                participant.stats["highest_break"] = max(
                    participant.stats["highest_break"], max(breaks)
                )
                participant.stats["average_break"] = sum(breaks) / len(breaks)

            # Update foul count
            participant.stats["total_fouls"] += len(
                [f for f in match.stats.get("fouls", []) if f["player_id"] == participant.id]
            )

    @staticmethod
    def get_match_history(
        participant_id: int, limit: int = 10, offset: int = 0
    ) -> List[TournamentMatch]:
        """Get match history for a participant.

        Args:
            participant_id: Participant ID
            limit: Maximum number of matches to return
            offset: Number of matches to skip

        Returns:
            List[TournamentMatch]: List of matches
        """
        return (
            TournamentMatch.query.filter(
                (TournamentMatch.player1_id == participant_id)
                | (TournamentMatch.player2_id == participant_id)
            )
            .order_by(TournamentMatch.end_time.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_participant_stats(participant_id: int) -> Optional[Dict[str, Any]]:
        """Get statistics for a participant.

        Args:
            participant_id: Participant ID

        Returns:
            Optional[Dict[str, Any]]: Participant statistics if found
        """
        participant = TournamentParticipant.query.get(participant_id)
        if not participant:
            return None

        return participant.stats
