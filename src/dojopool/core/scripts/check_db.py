from flask_caching import Cache
from flask_caching import Cache
"""
Script to check database contents.
"""

import sys
from pathlib import Path

# Add the src directory to the Python path
src_path = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, src_path)

from app import create_app
from core.models import Game, Tournament, User, Venue


def check_database():
    """Check database contents."""
    app = create_app()
    with app.app_context():
        # Check users
        users = User.query.all()
        print("\nUsers:")
        for user in users:
            print(f"- {user.username} ({user.email})")

        # Check venues
        venues = Venue.query.all()
        print("\nVenues:")
        for venue in venues:
            print(f"- {venue.name} ({venue.address})")

        # Check tournaments
        tournaments = Tournament.query.all()
        print("\nTournaments:")
        for tournament in tournaments:
            print(f"- {tournament.name} at {Venue.query.get(tournament.venue_id).name}")

        # Check games
        games = Game.query.all()
        print("\nGames:")
        for game in games:
            player = User.query.get(game.player_id)
            venue = Venue.query.get(game.venue_id)
            print(
                f"- {game.game_type} game by {player.username} at {venue.name} (Status: {game.status})"
            )


if __name__ == "__main__":
    check_database()
