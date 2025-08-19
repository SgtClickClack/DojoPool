import os
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
from sqlalchemy import String, cast

from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from dojopool.core.database import db
from dojopool.forms.venue_forms import VenueForm, VenueSearchForm
from dojopool.models.venue import Venue
from dojopool.models.venue_checkin import VenueCheckIn
from dojopool.extensions import cache

venue_bp = Blueprint("venue", __name__)


@venue_bp.route("/venues")
def list_venues():
    """List all venues with optional filtering."""
    form = VenueSearchForm(request.args)
    query = Venue.query.filter_by(is_active=True)

    if form.city.data:
        query = query.filter(Venue.city.ilike(f"%{form.city.data}%"))  # type: ignore
    if form.state.data:
        query = query.filter(Venue.state.ilike(f"%{form.state.data}%"))  # type: ignore
    if form.features.data:
        query = query.filter(cast(Venue.amenities_summary, String).ilike(f"%{form.features.data}%"))  # type: ignore
    if form.min_tables.data:
        query = query.filter(Venue.tables >= form.min_tables.data)
    if form.min_rating.data:
        query = query.filter(Venue.rating >= form.min_rating.data)

    venues = query.order_by(Venue.rating.desc()).all()
    return render_template("venue_list.html", venues=venues, form=form)


@venue_bp.route("/venues/new", methods=["GET", "POST"])
@login_required
def create_venue():
    """Create a new venue."""
    form = VenueForm()

    if form.validate_on_submit():
        try:
            # Create venue object
            venue = Venue()
            form.populate_obj(venue)

            # Handle image upload
            if form.image.data:
                filename = secure_filename(form.image.data.filename)
                filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                form.image.data.save(filepath)
                venue.featured_image = url_for("static", filename=f"uploads/{filename}")
            # Format hours
            venue.hours_data = {  # type: ignore
                "monday": {
                    "open": form.monday_open.data.strftime("%H:%M") if form.monday_open.data else None,
                    "close": form.monday_close.data.strftime("%H:%M") if form.monday_close.data else None,
                },
                "tuesday": {
                    "open": form.tuesday_open.data.strftime("%H:%M") if form.tuesday_open.data else None,
                    "close": form.tuesday_close.data.strftime("%H:%M") if form.tuesday_close.data else None,
                },
                "wednesday": {
                    "open": form.wednesday_open.data.strftime("%H:%M") if form.wednesday_open.data else None,
                    "close": form.wednesday_close.data.strftime("%H:%M") if form.wednesday_close.data else None,
                },
                "thursday": {
                    "open": form.thursday_open.data.strftime("%H:%M") if form.thursday_open.data else None,
                    "close": form.thursday_close.data.strftime("%H:%M") if form.thursday_close.data else None,
                },
                "friday": {
                    "open": form.friday_open.data.strftime("%H:%M") if form.friday_open.data else None,
                    "close": form.friday_close.data.strftime("%H:%M") if form.friday_close.data else None,
                },
                "saturday": {
                    "open": form.saturday_open.data.strftime("%H:%M") if form.saturday_open.data else None,
                    "close": form.saturday_close.data.strftime("%H:%M") if form.saturday_close.data else None,
                },
                "sunday": {
                    "open": form.sunday_open.data.strftime("%H:%M") if form.sunday_open.data else None,
                    "close": form.sunday_close.data.strftime("%H:%M") if form.sunday_close.data else None,
                },
            }

            # Format pricing
            venue.pricing_data = {"per_hour": form.per_hour.data, "per_game": form.per_game.data}  # type: ignore

            db.session.add(venue)
            db.session.commit()

            flash("Venue created successfully!", "success")
            return redirect(url_for("venue.get_venue", venue_id=venue.id))

        except Exception as e:
            db.session.rollback()
            flash(f"Error creating venue: {str(e)}", "error")

    return render_template("venue_form.html", form=form)


@venue_bp.route("/venues/<int:venue_id>")
@cache.cached(timeout=600)
def get_venue(venue_id):
    """Get venue details."""
    venue = Venue.query.get_or_404(venue_id)

    # Get current occupancy information
    occupancy = {
        "active_games": len(venue.get_current_games()),
        "available_tables": venue.tables - len(venue.get_current_games()),
        "checked_in_players": len(venue.get_checked_in_players()),
    }

    return render_template(
        "venue_detail.html",
        venue=venue,
        occupancy=occupancy,
        maps_api_key=current_app.config["GOOGLE_MAPS_API_KEY"],
    )


@venue_bp.route("/venues/<int:venue_id>/edit", methods=["GET", "POST"])
@login_required
def edit_venue(venue_id):
    """Edit venue details."""
    venue = Venue.query.get_or_404(venue_id)
    form = VenueForm(obj=venue)

    if form.validate_on_submit():
        try:
            form.populate_obj(venue)

            # Handle image upload
            if form.image.data:
                filename = secure_filename(form.image.data.filename)
                filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                form.image.data.save(filepath)
                venue.featured_image = url_for("static", filename=f"uploads/{filename}")

            # Format hours
            venue.hours_data = {  # type: ignore
                "monday": {
                    "open": form.monday_open.data.strftime("%H:%M") if form.monday_open.data else None,
                    "close": form.monday_close.data.strftime("%H:%M") if form.monday_close.data else None,
                },
                "tuesday": {
                    "open": form.tuesday_open.data.strftime("%H:%M") if form.tuesday_open.data else None,
                    "close": form.tuesday_close.data.strftime("%H:%M") if form.tuesday_close.data else None,
                },
                "wednesday": {
                    "open": form.wednesday_open.data.strftime("%H:%M") if form.wednesday_open.data else None,
                    "close": form.wednesday_close.data.strftime("%H:%M") if form.wednesday_close.data else None,
                },
                "thursday": {
                    "open": form.thursday_open.data.strftime("%H:%M") if form.thursday_open.data else None,
                    "close": form.thursday_close.data.strftime("%H:%M") if form.thursday_close.data else None,
                },
                "friday": {
                    "open": form.friday_open.data.strftime("%H:%M") if form.friday_open.data else None,
                    "close": form.friday_close.data.strftime("%H:%M") if form.friday_close.data else None,
                },
                "saturday": {
                    "open": form.saturday_open.data.strftime("%H:%M") if form.saturday_open.data else None,
                    "close": form.saturday_close.data.strftime("%H:%M") if form.saturday_close.data else None,
                },
                "sunday": {
                    "open": form.sunday_open.data.strftime("%H:%M") if form.sunday_open.data else None,
                    "close": form.sunday_close.data.strftime("%H:%M") if form.sunday_close.data else None,
                },
            }

            # Format pricing
            venue.pricing_data = {"per_hour": form.per_hour.data, "per_game": form.per_game.data}  # type: ignore

            db.session.commit()
            flash("Venue updated successfully!", "success")
            return redirect(url_for("venue.get_venue", venue_id=venue.id))

        except Exception as e:
            db.session.rollback()
            flash(f"Error updating venue: {str(e)}", "error")

    return render_template("venue_form.html", form=form, venue=venue)


@venue_bp.route("/venues/<int:venue_id>/check-in", methods=["POST"])
@login_required
def check_in(venue_id):
    """Check in at a venue with QR code and geolocation validation."""
    venue = Venue.query.get_or_404(venue_id)

    data = request.get_json() or {}
    qr_code = data.get("qrCode")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    # Validate QR code (simple convention: qrCode == f'venue-{venue_id}')
    if qr_code is not None and qr_code != f"venue-{venue_id}":
        return jsonify({"error": "Invalid QR code for this venue."}), 400

    # Validate geolocation (must be within 50 meters of venue)
    if latitude is not None and longitude is not None and venue.latitude and venue.longitude:
        def haversine(lat1, lon1, lat2, lon2):
            # Haversine formula to calculate the distance between two lat/lon points in meters
            R = 6371000  # Earth radius in meters
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c
        distance = haversine(float(latitude), float(longitude), float(venue.latitude), float(venue.longitude))
        if distance > 50:
            return jsonify({"error": f"You must be within 50 meters of the venue to check in. (Distance: {distance:.1f}m)"}), 400

    # Check if user is already checked in
    existing_checkin = VenueCheckIn.query.filter_by(
        venue_id=venue_id, player_id=current_user.id
    ).first()

    if existing_checkin:
        return jsonify({"error": "You are already checked in at this venue"}), 400

    try:
        checkin = VenueCheckIn(  # type: ignore
            venue_id=venue_id,
            user_id=current_user.id,
            checked_in_at=datetime.utcnow()
        )
        db.session.add(checkin)
        db.session.commit()
        return jsonify({"message": "Check-in successful"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/rate", methods=["POST"])
@login_required
def rate_venue(venue_id):
    """Rate a venue."""
    venue = Venue.query.get_or_404(venue_id)
    data = request.get_json()

    if not data or "rating" not in data:
        return jsonify({"error": "Rating is required"}), 400

    try:
        rating = float(data["rating"])
        if not 0 <= rating <= 5:
            return jsonify({"error": "Rating must be between 0 and 5"}), 400

        # Update venue rating
        total = venue.rating * venue.total_ratings
        venue.total_ratings += 1
        venue.rating = (total + rating) / venue.total_ratings

        db.session.commit()
        return jsonify(
            {
                "message": "Rating submitted successfully",
                "new_rating": venue.rating,
                "total_ratings": venue.total_ratings,
            }
        )

    except ValueError:
        return jsonify({"error": "Invalid rating value"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/delete", methods=["POST"])
@login_required
def delete_venue(venue_id):
    """Delete (deactivate) a venue."""
    venue = Venue.query.get_or_404(venue_id)

    try:
        venue.is_active = False
        db.session.commit()
        flash("Venue deleted successfully!", "success")
        return redirect(url_for("venue.list_venues"))

    except Exception as e:
        db.session.rollback()
        flash(f"Error deleting venue: {str(e)}", "error")
        return redirect(url_for("venue.get_venue", venue_id=venue_id))
