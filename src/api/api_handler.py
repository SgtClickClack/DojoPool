# Shim module to maintain compatibility with tests that import from src.api.api_handler
# Re-export everything from the primary implementation located at api.api_handler
from api.api_handler import *  # noqa: F401,F403
