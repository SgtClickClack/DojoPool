"""WSGI entry point for the application."""

import os

import eventlet

# Monkey patch before importing any other modules
eventlet.monkey_patch(all=True)

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Flask, Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.app import create_app

app: create_app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
