import os
from typing import Optional

from flask import Flask

from dojopool.core.admin import bp as admin_bp
from dojopool.core.api import bp as api_bp
from dojopool.core.auth import bp as auth_bp
from dojopool.core.cli import init_app as init_cli
from dojopool.core.config import config
from dojopool.core.database import db
from dojopool.core.database.migrations import init_migrations

def create_app(config_name: ...): ...
