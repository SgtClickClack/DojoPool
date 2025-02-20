"""Maps routes module."""

from typing import Union

from flask import Blueprint, Response, jsonify, render_template

from dojopool.core.config import maps_config

bp = Blueprint("maps", __name__)


@bp.route("/map")
def show_map() -> str:
    """
    Render the map page with configuration.

    Returns:
        Rendered HTML template
    """
    try:
        # Get map configuration
        config = maps_config.get_frontend_config()
        return render_template("map.html", maps_config=config)
    except ValueError as e:
        # Handle missing API key
        return render_template("map.html", error=str(e))
    except Exception:
        # Handle other errors
        return render_template(
            "map.html", error="An error occurred loading the map configuration"
        )


@bp.route("/api/maps/config")
def get_map_config():
    """
    Get map configuration as JSON.

    Returns:
        JSON response with map configuration
    """
    try:
        config = maps_config.get_frontend_config()
        return jsonify(config)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
