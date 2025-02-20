"""CLI module.

This module provides command-line interface commands.
"""

import click
from flask.cli import with_appcontext
from src.core.database.init_db import init_db
from src.core.database.migrations import (
    create_tables,
    drop_tables,
    init_migrations,
    reset_tables,
)


@click.group()
def db_cli():
    """Database management commands."""
    pass


@db_cli.command("init")
@with_appcontext
def init_db_command():
    """Initialize database with tables and default data."""
    click.echo("Creating database tables...")
    create_tables()
    click.echo("Initializing migrations...")
    init_migrations()
    click.echo("Adding default data...")
    init_db()
    click.echo("Database initialization completed.")


@db_cli.command("reset")
@with_appcontext
def reset_db_command():
    """Reset database (drop all tables and recreate)."""
    if click.confirm("This will delete all data. Continue?"):
        click.echo("Resetting database...")
        reset_tables()
        click.echo("Adding default data...")
        init_db()
        click.echo("Database reset completed.")


@db_cli.command("drop")
@with_appcontext
def drop_db_command():
    """Drop all database tables."""
    if click.confirm("This will delete all data. Continue?"):
        click.echo("Dropping database tables...")
        drop_tables()
        click.echo("Database tables dropped.")


def init_app(app):
    """Initialize CLI with Flask application.

    Args:
        app: Flask application instance
    """
    app.cli.add_command(db_cli)
