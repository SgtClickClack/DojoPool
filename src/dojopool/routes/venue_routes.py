from flask import (
    Blueprint, render_template, request, redirect, url_for,
    flash, jsonify, current_app
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from src.models.venue import Venue, VenueCheckin
from src.forms.venue_forms import VenueForm, VenueSearchForm
from src.utils.validators import validate_coordinates
from src.core.database import db

venue_bp = Blueprint('venue', __name__)

@venue_bp.route('/venues')
def list_venues():
    """List all venues with optional filtering."""
    form = VenueSearchForm(request.args)
    query = Venue.query.filter_by(is_active=True)
    
    if form.city.data:
        query = query.filter(Venue.city.ilike(f'%{form.city.data}%'))
    if form.state.data:
        query = query.filter(Venue.state.ilike(f'%{form.state.data}%'))
    if form.features.data:
        query = query.filter(Venue.features.contains(form.features.data))
    if form.min_tables.data:
        query = query.filter(Venue.tables >= form.min_tables.data)
    if form.min_rating.data:
        query = query.filter(Venue.rating >= form.min_rating.data)
    
    venues = query.order_by(Venue.rating.desc()).all()
    return render_template('venue_list.html', venues=venues, form=form)

@venue_bp.route('/venues/new', methods=['GET', 'POST'])
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
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                form.image.data.save(filepath)
                venue.image_url = url_for('static', filename=f'uploads/{filename}')
            
            # Format hours
            venue.hours = {
                'monday': {'open': form.monday_open.data.strftime('%H:%M'),
                          'close': form.monday_close.data.strftime('%H:%M')},
                'tuesday': {'open': form.tuesday_open.data.strftime('%H:%M'),
                           'close': form.tuesday_close.data.strftime('%H:%M')},
                'wednesday': {'open': form.wednesday_open.data.strftime('%H:%M'),
                            'close': form.wednesday_close.data.strftime('%H:%M')},
                'thursday': {'open': form.thursday_open.data.strftime('%H:%M'),
                           'close': form.thursday_close.data.strftime('%H:%M')},
                'friday': {'open': form.friday_open.data.strftime('%H:%M'),
                          'close': form.friday_close.data.strftime('%H:%M')},
                'saturday': {'open': form.saturday_open.data.strftime('%H:%M'),
                           'close': form.saturday_close.data.strftime('%H:%M')},
                'sunday': {'open': form.sunday_open.data.strftime('%H:%M'),
                          'close': form.sunday_close.data.strftime('%H:%M')}
            }
            
            # Format pricing
            venue.pricing = {
                'per_hour': form.per_hour.data,
                'per_game': form.per_game.data
            }
            
            # Update location if coordinates provided
            if form.latitude.data and form.longitude.data:
                venue.update_location()
            
            db.session.add(venue)
            db.session.commit()
            
            flash('Venue created successfully!', 'success')
            return redirect(url_for('venue.get_venue', venue_id=venue.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating venue: {str(e)}', 'error')
    
    return render_template('venue_form.html', form=form)

@venue_bp.route('/venues/<int:venue_id>')
def get_venue(venue_id):
    """Get venue details."""
    venue = Venue.query.get_or_404(venue_id)
    
    # Get current occupancy information
    occupancy = {
        'active_games': len(venue.get_current_games()),
        'available_tables': venue.tables - len(venue.get_current_games()),
        'checked_in_players': len(venue.get_checked_in_players())
    }
    
    return render_template('venue_detail.html',
                         venue=venue,
                         occupancy=occupancy,
                         maps_api_key=current_app.config['GOOGLE_MAPS_API_KEY'])

@venue_bp.route('/venues/<int:venue_id>/edit', methods=['GET', 'POST'])
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
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                form.image.data.save(filepath)
                venue.image_url = url_for('static', filename=f'uploads/{filename}')
            
            # Format hours
            venue.hours = {
                'monday': {'open': form.monday_open.data.strftime('%H:%M'),
                          'close': form.monday_close.data.strftime('%H:%M')},
                'tuesday': {'open': form.tuesday_open.data.strftime('%H:%M'),
                           'close': form.tuesday_close.data.strftime('%H:%M')},
                'wednesday': {'open': form.wednesday_open.data.strftime('%H:%M'),
                            'close': form.wednesday_close.data.strftime('%H:%M')},
                'thursday': {'open': form.thursday_open.data.strftime('%H:%M'),
                           'close': form.thursday_close.data.strftime('%H:%M')},
                'friday': {'open': form.friday_open.data.strftime('%H:%M'),
                          'close': form.friday_close.data.strftime('%H:%M')},
                'saturday': {'open': form.saturday_open.data.strftime('%H:%M'),
                           'close': form.saturday_close.data.strftime('%H:%M')},
                'sunday': {'open': form.sunday_open.data.strftime('%H:%M'),
                          'close': form.sunday_close.data.strftime('%H:%M')}
            }
            
            # Format pricing
            venue.pricing = {
                'per_hour': form.per_hour.data,
                'per_game': form.per_game.data
            }
            
            # Update location if coordinates provided
            if form.latitude.data and form.longitude.data:
                venue.update_location()
            
            db.session.commit()
            flash('Venue updated successfully!', 'success')
            return redirect(url_for('venue.get_venue', venue_id=venue.id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating venue: {str(e)}', 'error')
    
    return render_template('venue_form.html', form=form, venue=venue)

@venue_bp.route('/venues/<int:venue_id>/check-in', methods=['POST'])
@login_required
def check_in(venue_id):
    """Check in at a venue."""
    venue = Venue.query.get_or_404(venue_id)
    
    # Check if user is already checked in
    existing_checkin = VenueCheckin.query.filter_by(
        venue_id=venue_id,
        player_id=current_user.id
    ).first()
    
    if existing_checkin:
        return jsonify({'error': 'You are already checked in at this venue'}), 400
    
    try:
        checkin = VenueCheckin(
            venue_id=venue_id,
            player_id=current_user.id,
            check_in_time=datetime.utcnow()
        )
        db.session.add(checkin)
        db.session.commit()
        return jsonify({'message': 'Check-in successful'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@venue_bp.route('/venues/<int:venue_id>/rate', methods=['POST'])
@login_required
def rate_venue(venue_id):
    """Rate a venue."""
    venue = Venue.query.get_or_404(venue_id)
    data = request.get_json()
    
    if not data or 'rating' not in data:
        return jsonify({'error': 'Rating is required'}), 400
    
    try:
        rating = float(data['rating'])
        if not 0 <= rating <= 5:
            return jsonify({'error': 'Rating must be between 0 and 5'}), 400
        
        # Update venue rating
        total = venue.rating * venue.total_ratings
        venue.total_ratings += 1
        venue.rating = (total + rating) / venue.total_ratings
        
        db.session.commit()
        return jsonify({
            'message': 'Rating submitted successfully',
            'new_rating': venue.rating,
            'total_ratings': venue.total_ratings
        })
        
    except ValueError:
        return jsonify({'error': 'Invalid rating value'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@venue_bp.route('/venues/<int:venue_id>/delete', methods=['POST'])
@login_required
def delete_venue(venue_id):
    """Delete (deactivate) a venue."""
    venue = Venue.query.get_or_404(venue_id)
    
    try:
        venue.is_active = False
        db.session.commit()
        flash('Venue deleted successfully!', 'success')
        return redirect(url_for('venue.list_venues'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting venue: {str(e)}', 'error')
        return redirect(url_for('venue.get_venue', venue_id=venue_id))
