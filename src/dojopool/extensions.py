"""Flask extensions for the application."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()

__all__ = [
    'db',
    'migrate',
    'mail'
]