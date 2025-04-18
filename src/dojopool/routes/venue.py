"""Venue routes for managing dojo venues."""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, render_template, request
from flask_login import current_user, login_required
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from ..models.user import User
from ..core.database import db
from ..core.models.tournament import Tournament
from ..core.models.venue import Venue, VenueCheckIn
from ..services.checkin_service import CheckInService
from ..utils.decorators import admin_required

bp = Blueprint("venue", __name__, url_prefix="/venues")


# Venue listing and search
@bp.route("/")
def venue_list():
    """List all venues with optional filtering."""
    # Get basic venue stats
    total_venues = Venue.query.count()
    open_venues = sum(1 for v in Venue.query.all() if v.is_open)
    total_active_players = VenueCheckIn.query.filter_by(checked_out_at=None).count()
    active_tournaments = Tournament.query.filter_by(status="ongoing").count()

    # Get user's recent venues if logged in
    recent_venues = []
    if current_user.is_authenticated:
        recent_checkins = CheckInService.get_user_checkins(current_user.id)
        recent_venues = [checkin.venue for checkin in recent_checkins]

    # Get all venues for initial display
    venues = Venue.query.all()
    user_checkins = set()
    if current_user.is_authenticated:
        user_checkins = {
            c.venue_id
            for c in VenueCheckIn.query.filter_by(
                user_id=current_user.id, checked_out_at=None
            ).all()
        }

    return render_template(
        "venue/venue_list.html",
        venues=venues,
        user_checkins=user_checkins,
        total_venues=total_venues,
        open_venues=open_venues,
        total_active_players=total_active_players,
        active_tournaments=active_tournaments,
        recent_venues=recent_venues,
        has_more=False,  # Implement pagination if needed
    )


@bp.route("/<int:venue_id>")
def venue_detail(venue_id):
    """Show venue details."""
    venue = Venue.query.get_or_404(venue_id)
    active_players = CheckInService.get_active_checkins(venue_id)
    user_checkins = set()
    if current_user.is_authenticated:
        user_checkins = {
            c.venue_id
            for c in VenueCheckIn.query.filter_by(
                user_id=current_user.id, checked_out_at=None
            ).all()
        }

    return render_template(
        "venue/venue_detail.html",
        venue=venue,
        active_players=active_players,
        user_checkins=user_checkins,
    )


# Venue management (admin only)
@bp.route("/create", methods=["GET", "POST"])
@login_required
@admin_required
def create_venue():
    """Create a new venue."""
    if request.method == "POST":
        data = request.get_json()

        venue = Venue(
            name=data["name"],
            address=data["address"],
            phone=data.get("phone"),
            email=data.get("email"),
            operating_hours=data.get("operating_hours", {}),
            total_tables=data.get("total_tables", 0),
            amenities=data.get("amenities", []),
        )

        db.session.add(venue)
        db.session.commit()

        return jsonify(venue.to_dict()), 201

    return render_template("venue/create.html")


@bp.route("/<int:venue_id>/edit", methods=["GET", "POST"])
@login_required
@admin_required
def edit_venue(venue_id):
    """Edit an existing venue."""
    venue = Venue.query.get_or_404(venue_id)

    if request.method == "POST":
        data = request.get_json()

        venue.name = data.get("name", venue.name)
        venue.address = data.get("address", venue.address)
        venue.phone = data.get("phone", venue.phone)
        venue.email = data.get("email", venue.email)
        venue.operating_hours = data.get("operating_hours", venue.operating_hours)
        venue.total_tables = data.get("total_tables", venue.total_tables)
        venue.amenities = data.get("amenities", venue.amenities)

        db.session.commit()

        return jsonify(venue.to_dict())

    return render_template("venue/edit.html", venue=venue)


# Check-in system
@bp.route("/<int:venue_id>/checkin", methods=["POST"])
@login_required
def check_in(venue_id):
    """Check in at a venue."""
    try:
        data = request.get_json() or {}
        checkin = CheckInService.check_in(
            user_id=current_user.id,
            venue_id=venue_id,
            table_number=data.get("table_number"),
            game_type=data.get("game_type"),
        )
        return jsonify(checkin.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:venue_id>/checkout", methods=["POST"])
@login_required
def check_out(venue_id):
    """Check out from a venue."""
    try:
        checkin = CheckInService.check_out(user_id=current_user.id, venue_id=venue_id)
        return jsonify(checkin.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# Venue stats and activity
@bp.route("/<int:venue_id>/stats")
def venue_stats(venue_id):
    """Get venue statistics."""
    venue = Venue.query.get_or_404(venue_id)
    time_range = request.args.get("range", "day")
    stats = venue.get_stats(time_range)

    # Get detailed stats for comparison
    now = datetime.utcnow()
    if time_range == "day":
        previous_start = now - timedelta(days=2)
        current_start = now - timedelta(days=1)
    elif time_range == "week":
        previous_start = now - timedelta(weeks=2)
        current_start = now - timedelta(weeks=1)
    elif time_range == "month":
        previous_start = now - timedelta(days=60)
        current_start = now - timedelta(days=30)
    else:  # year
        previous_start = now - timedelta(days=730)
        current_start = now - timedelta(days=365)

    detailed_stats = []
    metrics = [
        ("Total Check-ins", VenueCheckIn.query.filter_by(venue_id=venue_id)),
        ("Average Duration", VenueCheckIn.query.filter_by(venue_id=venue_id)),
        ("Tournament Participation", Tournament.query.filter_by(venue_id=venue_id)),
    ]

    for name, query in metrics:
        current_value = query.filter(
            VenueCheckIn.checked_in_at >= current_start, VenueCheckIn.checked_in_at < now
        ).count()

        previous_value = query.filter(
            VenueCheckIn.checked_in_at >= previous_start, VenueCheckIn.checked_in_at < current_start
        ).count()

        if previous_value > 0:
            change = ((current_value - previous_value) / previous_value) * 100
        else:
            change = 100 if current_value > 0 else 0

        detailed_stats.append(
            {
                "name": name,
                "current": current_value,
                "previous": previous_value,
                "change": round(change, 1),
            }
        )

    return render_template(
        "venue/venue_stats.html", venue=venue, stats=stats, detailed_stats=detailed_stats
    )


@bp.route("/<int:venue_id>/leaderboard")
def venue_leaderboard(venue_id):
    """Show venue-specific leaderboard."""
    venue = Venue.query.get_or_404(venue_id)

    # Get leaderboard data
    leaderboard_query = (
        db.session.query(
            VenueCheckIn.user_id,
            func.count(VenueCheckIn.id).label("games_played"),
            func.avg(VenueCheckIn.duration).label("avg_duration"),
        )
        .filter_by(venue_id=venue_id)
        .group_by(VenueCheckIn.user_id)
        .order_by(func.count(VenueCheckIn.id).desc())
    )

    leaderboard = []
    for rank, (user_id, games_played, _avg_duration) in enumerate(leaderboard_query, 1):
        user = User.query.get(user_id)
        if user:
            leaderboard.append(
                {
                    "rank": rank,
                    "id": user.id,
                    "username": user.username,
                    "avatar_url": user.avatar_url,
                    "games_played": games_played,
                    "win_rate": 50.0,  # Implement actual win rate calculation
                    "high_break": 0,  # Implement high break tracking
                    "score": games_played * 100,  # Implement proper scoring system
                    "trend": 0,  # Implement trend calculation
                }
            )

    # Get top 3 players for podium
    top_players = leaderboard[:3] if len(leaderboard) >= 3 else []

    # Get user stats if logged in
    user_stats = None
    if current_user.is_authenticated:
        user_entry = next((entry for entry in leaderboard if entry["id"] == current_user.id), None)
        if user_entry:
            user_stats = user_entry

    # Get venue records
    venue_records = [
        {"name": "Highest Break", "value": "147", "player": "John Doe"},
        {"name": "Most Consecutive Wins", "value": "10", "player": "Jane Smith"},
        {"name": "Longest Session", "value": "12 hours", "player": "Mike Johnson"},
    ]

    return render_template(
        "venue/venue_leaderboard.html",
        venue=venue,
        leaderboard=leaderboard,
        top_players=top_players,
        user_stats=user_stats,
        venue_records=venue_records,
    )


@bp.route("/<int:venue_id>/tournaments")
def venue_tournaments(venue_id):
    """List tournaments at this venue."""
    venue = Venue.query.get_or_404(venue_id)

    # Get current tournament
    current_tournament = venue.current_tournament

    # Get all other tournaments
    tournaments = (
        Tournament.query.filter_by(venue_id=venue_id).order_by(Tournament.start_time.desc()).all()
    )

    # Remove current tournament from list if it exists
    if current_tournament:
        tournaments = [t for t in tournaments if t.id != current_tournament.id]

    return render_template(
        "venue/venue_tournaments.html",
        venue=venue,
        current_tournament=current_tournament,
        tournaments=tournaments,
        has_more=False,  # Implement pagination if needed
    )


# API endpoints for venue data
@bp.route("/api/search")
def api_search_venues():
    """Search venues by name, location, etc."""
    query = request.args.get("q", "")
    filter_type = request.args.get("filter", "all")

    venues = Venue.query

    if query:
        venues = venues.filter(
            db.or_(Venue.name.ilike(f"%{query}%"), Venue.address.ilike(f"%{query}%"))
        )

    if filter_type == "open":
        venues = [v for v in venues if v.is_open]
    elif filter_type == "tournaments":
        venues = venues.join(Tournament).filter(Tournament.status == "ongoing")
    elif filter_type == "active":
        venues = sorted(venues, key=lambda v: v.active_players, reverse=True)

    return jsonify(
        {
            "venues": [v.to_dict() for v in venues],
            "has_more": False,  # Implement pagination if needed
        }
    )


@bp.route("/api/<int:venue_id>/active-players")
def api_active_players(venue_id):
    """Get list of currently active players at venue."""
    active_checkins = CheckInService.get_active_checkins(venue_id)
    return jsonify(
        [
            {
                "user": checkin.user.to_dict(),
                "checked_in_at": checkin.checked_in_at.isoformat(),
                "table_number": checkin.table_number,
                "game_type": checkin.game_type,
            }
            for checkin in active_checkins
        ]
    )


@bp.route("/api/<int:venue_id>/stats")
def api_venue_stats(venue_id):
    """Get venue statistics in JSON format."""
    venue = Venue.query.get_or_404(venue_id)
    time_range = request.args.get("range", "day")
    return jsonify(venue.get_stats(time_range))
