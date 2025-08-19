"""Commands registration module."""

import click
from flask.cli import with_appcontext

from ..extensions import db


def register_commands(app):
    """Register Flask CLI commands."""

    @app.cli.command("init-db")
    @with_appcontext
    def init_db():
        """Initialize the database."""
        db.create_all()
        click.echo("Initialized the database.")

    @app.cli.command("drop-db")
    @with_appcontext
    def drop_db():
        """Drop the database."""
        if click.confirm("Are you sure you want to drop all tables?"):
            db.drop_all()
            click.echo("Dropped all tables.")
