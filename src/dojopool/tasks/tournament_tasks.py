"""Tournament scheduled tasks module."""
from datetime import datetime, timedelta
from typing import List

from src.core import db
from src.models.tournament import Tournament
from src.services.notification_service import NotificationService
from src.services.tournament_service import TournamentService

def process_tournament_tasks():
    """Process all tournament-related tasks."""
    start_pending_tournaments()
    send_match_reminders()
    check_tournament_completions()
    cleanup_expired_tournaments()

def start_pending_tournaments():
    """Start tournaments that are scheduled to begin."""
    pending_tournaments = Tournament.query.filter(
        Tournament.status == 'registration',
        Tournament.start_date <= datetime.utcnow()
    ).all()
    
    for tournament in pending_tournaments:
        try:
            TournamentService.start_tournament(tournament.id)
            NotificationService.notify_tournament_start(tournament.id)
        except ValueError as e:
            print(f"Failed to start tournament {tournament.id}: {str(e)}")

def send_match_reminders():
    """Send reminders for upcoming matches."""
    NotificationService.send_match_reminders()

def check_tournament_completions():
    """Check and process completed tournaments."""
    active_tournaments = Tournament.query.filter_by(status='in_progress').all()
    
    for tournament in active_tournaments:
        if tournament.check_completion():
            try:
                # Update tournament status
                tournament.status = 'completed'
                tournament.completed_at = datetime.utcnow()
                tournament.save()
                
                # Process final standings and update player stats
                standings = tournament.get_standings()
                for standing in standings:
                    player = standing['player']
                    player.update_tournament_stats({
                        'tournament_id': tournament.id,
                        'winner_id': standings[0]['player'].id,
                        'matches': tournament.bracket['matches'],
                        'points': calculate_tournament_points(standing)
                    })
                
                # Send completion notifications
                NotificationService.notify_tournament_completion(tournament.id)
            except Exception as e:
                print(f"Failed to process tournament completion {tournament.id}: {str(e)}")

def cleanup_expired_tournaments():
    """Clean up expired tournament registrations."""
    expired_tournaments = Tournament.query.filter(
        Tournament.status == 'registration',
        Tournament.start_date <= datetime.utcnow() - timedelta(hours=1)
    ).all()
    
    for tournament in expired_tournaments:
        try:
            if len(tournament.players) < tournament.rules.get('min_players', 2):
                tournament.status = 'cancelled'
                tournament.save()
                
                # Notify registered players
                for player in tournament.players:
                    NotificationService.send_notification(
                        player_id=player.id,
                        title='Tournament Cancelled',
                        message=f'Tournament {tournament.name} has been cancelled due to insufficient players',
                        data={
                            'type': 'tournament_cancelled',
                            'tournament_id': tournament.id
                        }
                    )
        except Exception as e:
            print(f"Failed to cleanup tournament {tournament.id}: {str(e)}")

def calculate_tournament_points(standing: dict) -> int:
    """Calculate tournament points based on placement and matches."""
    # Base points for placement
    placement_points = {
        0: 100,  # Winner
        1: 70,   # Runner-up
        2: 50,   # Third place
        3: 30    # Fourth place
    }
    
    placement = standing.get('placement', len(placement_points))
    points = placement_points.get(placement, 20)  # Default 20 points for participation
    
    # Additional points for matches won
    matches_won = standing.get('matches_won', 0)
    points += matches_won * 10
    
    return points
