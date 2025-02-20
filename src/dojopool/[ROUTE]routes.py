from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, render_template
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.app import app


@app.route("/")
def index() -> str :
    return render_template("landingetattr(g, "html", None)", api_key=app.config["GOOGLE_MAPS_API_KEY"])


@app.route("/map")
def map_page() :
    return render_template("map.html", api_key=app.config["GOOGLE_MAPS_API_KEY"])


@app.route("/performance")
def performance_dashboard() -> str :
    return render_template("performance.html")


@app.route("/status")
def performance_status() :
    return render_template("user-performance.html")


@app.route("/test")
def test_runner():
    """Serve the mobile device test runner page."""
    return render_template("test-runner.html")
