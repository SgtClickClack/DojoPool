from flask import Blueprint
from werkzeug.wrappers import Response as WerkzeugResponse

auth_bp = Blueprint("auth", __name__)


# Define your authentication routes below.
# For example:
@auth_bp.route("/login")
def login():
    return "Login Page"
