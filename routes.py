from flask import Blueprint, render_template
from flask_login import login_required

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/')
def index():
    """Render the index page"""
    return render_template('index.html')

@routes_bp.route('/game')
@login_required
def game():
    """Render the game page"""
    return render_template('game.html')
