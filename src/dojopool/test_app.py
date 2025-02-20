"""Test Flask application."""

import eventlet

eventlet.monkey_patch()

import os
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

import pytest
from dotenv import load_dotenv
from flask import Flask, Request, Response, current_app
from flask.typing import ResponseReturnValue
from flask_login import LoginManager
from werkzeug.wrappers import Response as WerkzeugResponse

app: Flask = Flask(__name__)

# Load environment variables
load_dotenv()

# Basic configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
login_manager: LoginManager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"


@app.route("/")
def index():
    """Test route."""
    return "Hello, World!"


@pytest.fixture
def app():
    app: Flask = Flask(__name__)
    app.config["TESTING"] = True
    return app


def test_index(app) -> None:
    client: Any = app.test_client()
    response: Any = client.get("/")
    assert response.status_code == 200


if __name__ == "__main__":
    app.run(debug=True)
