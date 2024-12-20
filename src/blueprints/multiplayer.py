import logging
from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room, leave_room
from flask_login import current_user, login_required
from datetime import datetime, timedelta
from extensions import db
from models import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

multiplayer = Blueprint("multiplayer", __name__)

# Store active user sessions and their rooms
active_users = {}
user_rooms = {}
ongoing_challenges = {}

def get_nearby_room(lat, lng):
    """Generate a room name based on approximate location (100m grid)"""
    # Round coordinates to create a grid of roughly 100m squares
    grid_lat = round(lat * 1000) / 1000
    grid_lng = round(lng * 1000) / 1000
    return f"area_{grid_lat}_{grid_lng}"

@multiplayer.route("/api/join-chat", methods=["POST"])
@login_required
def join_chat():
    try:
        data = request.get_json()
        lat = float(data.get("lat"))
        lng = float(data.get("lng"))
        
        room = get_nearby_room(lat, lng)
        
        # Update user's current room
        if current_user.id in user_rooms:
            old_room = user_rooms[current_user.id]
            leave_room(old_room)
            
        user_rooms[current_user.id] = room
        join_room(room)
        
        # Notify others in the room
        emit("user_joined", {
            "user": current_user.username,
            "timestamp": datetime.utcnow().isoformat()
        }, room=room)
        
        return jsonify({"status": "success", "room": room})
    except Exception as e:
        logger.error(f"Error joining chat: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@multiplayer.route("/api/send-message", methods=["POST"])
@login_required
def send_message():
    try:
        data = request.get_json()
        message = data.get("message")
        room = user_rooms.get(current_user.id)
        
        if not room:
            return jsonify({"status": "error", "message": "Not in any chat room"}), 400
            
        emit("new_message", {
            "user": current_user.username,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }, room=room)
        
        return jsonify({"status": "success"})
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@multiplayer.route("/api/challenge-player", methods=["POST"])
@login_required
def challenge_player():
    try:
        data = request.get_json()
        target_user_id = data.get("target_user_id")
        duration = int(data.get("duration", 300))  # Default 5 minutes
        
        room = user_rooms.get(current_user.id)
        if not room:
            return jsonify({"status": "error", "message": "Not in range of target player"}), 400
        
        # Create challenge data
        challenge_id = f"challenge_{current_user.id}_{target_user_id}_{datetime.utcnow().timestamp()}"
        ongoing_challenges[challenge_id] = {
            "challenger_id": current_user.id,
            "challenger_name": current_user.username,
            "target_id": target_user_id,
            "duration": duration,
            "status": "pending",
            "start_time": None,
            "scores": {str(current_user.id): 0}
        }
            
        emit("challenge_received", {
            "challenge_id": challenge_id,
            "challenger": current_user.username,
            "challenger_id": current_user.id,
            "duration": duration,
            "timestamp": datetime.utcnow().isoformat()
        }, room=room)
        
        return jsonify({"status": "success", "challenge_id": challenge_id})
    except Exception as e:
        logger.error(f"Error sending challenge: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@multiplayer.route("/api/respond-to-challenge", methods=["POST"])
@login_required
def respond_to_challenge():
    try:
        data = request.get_json()
        challenge_id = data.get("challenge_id")
        accept = data.get("accept", False)
        
        if challenge_id not in ongoing_challenges:
            return jsonify({"status": "error", "message": "Challenge not found"}), 404
            
        challenge = ongoing_challenges[challenge_id]
        if challenge["target_id"] != current_user.id:
            return jsonify({"status": "error", "message": "Not the challenge target"}), 403
            
        room = user_rooms.get(current_user.id)
        if not room:
            return jsonify({"status": "error", "message": "Not in a valid room"}), 400
            
        if accept:
            # Start the challenge
            challenge["status"] = "active"
            challenge["start_time"] = datetime.utcnow()
            challenge["scores"][str(current_user.id)] = 0
            
            emit("challenge_started", {
                "challenge_id": challenge_id,
                "players": [
                    {"id": challenge["challenger_id"], "name": challenge["challenger_name"]},
                    {"id": current_user.id, "name": current_user.username}
                ],
                "duration": challenge["duration"],
                "start_time": challenge["start_time"].isoformat()
            }, room=room)
        else:
            # Delete the challenge
            del ongoing_challenges[challenge_id]
            emit("challenge_declined", {
                "challenge_id": challenge_id,
                "decliner": current_user.username
            }, room=room)
            
        return jsonify({"status": "success"})
    except Exception as e:
        logger.error(f"Error responding to challenge: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@multiplayer.route("/api/update-challenge-score", methods=["POST"])
@login_required
def update_challenge_score():
    try:
        data = request.get_json()
        challenge_id = data.get("challenge_id")
        score_increment = int(data.get("score_increment", 0))
        
        if challenge_id not in ongoing_challenges:
            return jsonify({"status": "error", "message": "Challenge not found"}), 404
            
        challenge = ongoing_challenges[challenge_id]
        if str(current_user.id) not in challenge["scores"]:
            return jsonify({"status": "error", "message": "Not part of this challenge"}), 403
            
        # Check if challenge is still active
        if challenge["status"] != "active":
            return jsonify({"status": "error", "message": "Challenge is not active"}), 400
            
        elapsed_time = datetime.utcnow() - challenge["start_time"]
        if elapsed_time > timedelta(seconds=challenge["duration"]):
            # End the challenge
            challenge["status"] = "completed"
            room = user_rooms.get(current_user.id)
            
            # Determine winner
            scores = challenge["scores"]
            winner_id = max(scores.items(), key=lambda x: x[1])[0]
            winner = User.query.get(int(winner_id))
            
            emit("challenge_ended", {
                "challenge_id": challenge_id,
                "scores": scores,
                "winner": {
                    "id": winner.id,
                    "name": winner.username,
                    "score": scores[str(winner.id)]
                }
            }, room=room)
            
            return jsonify({"status": "success", "message": "Challenge ended"})
            
        # Update score
        challenge["scores"][str(current_user.id)] += score_increment
        
        # Broadcast score update
        room = user_rooms.get(current_user.id)
        emit("score_updated", {
            "challenge_id": challenge_id,
            "player_id": current_user.id,
            "new_score": challenge["scores"][str(current_user.id)]
        }, room=room)
        
        return jsonify({"status": "success"})
    except Exception as e:
        logger.error(f"Error updating challenge score: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
