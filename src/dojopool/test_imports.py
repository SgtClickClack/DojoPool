from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

"""Test imports for DojoPool."""


def test_imports() -> bool:
    """Test that we can import our key modules."""
    try:
        import eventlet
        import flask
        import flask_login
        import flask_sqlalchemy

        print("✅ All core imports successful!")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False


if __name__ == "__main__":
    test_imports()
