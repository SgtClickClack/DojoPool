from flask import Blueprint, request, jsonify, send_file, redirect
from flask_login import current_user
from dojopool.models.video_highlight import VideoHighlight, HighlightStatus
from dojopool.core.database import db
from sqlalchemy.orm.exc import NoResultFound
from datetime import datetime
import threading
import time
import os
# TODO: Import and use async task queue for Wan 2.1 integration

video_highlight_api = Blueprint('video_highlight_api', __name__, url_prefix='/api/highlights')

def require_auth():
    # TODO: Replace with actual auth decorator or logic
    def decorator(f):
        def wrapper(*args, **kwargs):
            # Placeholder: always allow for now
            return f(*args, **kwargs)
        return wrapper
    return decorator

def async_generate_highlight_task(highlight_id):
    # TODO: Integrate with Wan 2.1 AI system for video highlight generation
    print(f"[Wan 2.1] Async highlight generation started for ID: {highlight_id}")
    time.sleep(2)  # Simulate processing delay
    highlight = VideoHighlight.query.get(highlight_id)
    if not highlight:
        print(f"[Wan 2.1] Highlight {highlight_id} not found.")
        return
    # Simulate video generation and update
    highlight.status = HighlightStatus.COMPLETED.value
    highlight.video_url = f"https://cdn.dojopool.com/highlights/{highlight_id}.mp4"
    highlight.thumbnail_url = f"https://cdn.dojopool.com/highlights/{highlight_id}.jpg"
    highlight.duration = 60
    highlight.updated_at = datetime.utcnow()
    db.session.commit()
    print(f"[Wan 2.1] Highlight {highlight_id} generation complete.")

@video_highlight_api.route('/generate', methods=['POST'])
@require_auth()
def generate_highlight():
    data = request.json
    tournament_id = data.get('tournamentId')
    user_id = data.get('userId')
    game_id = data.get('gameId')
    highlights = data.get('highlights', [])
    # TODO: Validate user, tournament, and game existence
    # TODO: Validate user is authorized to generate highlight
    # TODO: Validate game is completed
    highlight = VideoHighlight(
        tournament_id=tournament_id,
        user_id=user_id,
        game_id=game_id,
        status=HighlightStatus.PENDING.value,
        highlight_metadata={
            'requested_highlights': highlights
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.session.add(highlight)
    db.session.commit()
    # Trigger async highlight generation (Wan 2.1)
    threading.Thread(target=async_generate_highlight_task, args=(highlight.id,)).start()
    return jsonify({'message': 'Highlight generation started', 'highlightId': highlight.id}), 202

@video_highlight_api.route('/tournament/<int:tournament_id>', methods=['GET'])
def list_highlights_by_tournament(tournament_id):
    highlights = VideoHighlight.query.filter_by(tournament_id=tournament_id).all()
    return jsonify([
        {
            'id': h.id,
            'user_id': h.user_id,
            'status': h.status,
            'video_url': h.video_url,
            'thumbnail_url': h.thumbnail_url,
            'duration': h.duration,
            'highlight_metadata': h.highlight_metadata,
            'created_at': h.created_at,
            'updated_at': h.updated_at
        } for h in highlights
    ])

@video_highlight_api.route('/<int:highlight_id>/share', methods=['POST'])
@require_auth()
def share_highlight(highlight_id):
    try:
        highlight = VideoHighlight.query.filter_by(id=highlight_id).one()
    except NoResultFound:
        return jsonify({'error': 'Highlight not found'}), 404
    # TODO: Implement sharing logic (e.g., generate shareable link, notify users)
    return jsonify({'message': f'Highlight {highlight_id} shared.'})

@video_highlight_api.route('/download/<int:highlight_id>', methods=['GET'])
@require_auth()
def download_highlight(highlight_id):
    from dojopool.models.video_highlight import VideoHighlight
    highlight = VideoHighlight.query.filter_by(id=highlight_id).first()
    if not highlight:
        return jsonify({'error': 'Highlight not found'}), 404
    if not highlight.video_url:
        return jsonify({'error': 'Video not available yet'}), 400
    # Serve local file if path, else redirect/return remote URL
    if highlight.video_url.startswith('http'):
        # TODO: In production, use CDN streaming or signed URL
        return jsonify({'video_url': highlight.video_url})
    else:
        # Assume local file path (absolute or relative to a known directory)
        video_path = highlight.video_url
        if not os.path.isfile(video_path):
            return jsonify({'error': 'Video file not found on server'}), 404
        return send_file(video_path, mimetype='video/mp4', as_attachment=True, download_name=f"highlight_{highlight_id}.mp4")

@video_highlight_api.route('/<int:highlight_id>/download', methods=['GET'])
def download_highlight_old(highlight_id):
    try:
        highlight = VideoHighlight.query.filter_by(id=highlight_id).one()
    except NoResultFound:
        return jsonify({'error': 'Highlight not found'}), 404
    # TODO: Implement actual video file serving
    if not highlight.video_url:
        return jsonify({'error': 'Video not available yet'}), 400
    return jsonify({'video_url': highlight.video_url})

# TODO: Replace threading.Thread with a real async task queue (Celery, RQ, etc.) for Wan 2.1 integration 