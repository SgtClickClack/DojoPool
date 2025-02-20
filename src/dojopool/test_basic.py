from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

"""Basic test script."""

print("Starting test script...")

try:
    from flask import Flask

    print("✅ Flask imported successfully!")

    app: Flask = Flask(__name__)
    print("✅ Flask app created!")

    app.config["SECRET_KEY"] = "test-key"
    print("✅ App configured!")

    @app.route("/")
    def hello() -> str:
        return "Hello, World!"

    print("✅ Route added!")
    print("Starting Flask server...")

    if __name__ == "__main__":
        # Disabling the auto-reloader to reduce CPU usage during development.
        app.run(debug=True, use_reloader=False)
except Exception as e:
    print(f"❌ Error: {e}")


def test_example() -> None:
    # test code here
    # Example test implementation; update as needed.
    def my_function():
        return 42

    expected_value: int = 42
    assert my_function() == expected_value
