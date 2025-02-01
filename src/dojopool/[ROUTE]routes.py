from flask import render_template

from dojopool.app import app


@app.route("/")
def index():
    return render_template("landing.html", api_key=app.config["GOOGLE_MAPS_API_KEY"])


@app.route("/map")
def map_page():
    return render_template("map.html", api_key=app.config["GOOGLE_MAPS_API_KEY"])


@app.route("/performance")
def performance_dashboard():
    return render_template("performance.html")


@app.route("/status")
def performance_status():
    return render_template("user-performance.html")


@app.route("/test")
def test_runner():
    """Serve the mobile device test runner page."""
    return render_template("test-runner.html")
