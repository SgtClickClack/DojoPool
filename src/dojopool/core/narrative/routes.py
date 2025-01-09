from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from src.core.models import User, db
from src.core.auth.utils import admin_required
from datetime import datetime

narrative_bp = Blueprint('narrative', __name__, url_prefix='/narrative')