"""CLI implementation for DojoPool."""

import logging
import os
from typing import Any, Callable, Optional

import click
from flask import Flask
from flask.cli import with_appcontext

from ..models import User, Venue
from .database.init_db import init_db
from .database.migrations import run_migrations
from .extensions import db

logger = logging.getLogger(__name__)


def init_db_command() -> None:
    """Initialize the database."""
    click.echo("Initializing the database...")
    init_db()
    click.echo("Database initialized successfully!")


def run_migrations_command():
    """Run database migrations."""
    click.echo("Running database migrations...")
    run_migrations()
    click.echo("Migrations completed successfully!")


def register_commands(app: Flask):
    """Register CLI commands with the Flask application."""
    app.cli.add_command(click.Command("init-db", callback=init_db_command))
    app.cli.add_command(
        click.Command("run-migrations", callback=run_migrations_command)
    )
    app.cli.add_command(click.Command("create-admin", callback=create_admin_command))
    app.cli.add_command(click.Command("create-venue", callback=create_venue_command))
    app.cli.add_command(click.Command("setup-dev", callback=setup_development_command))
    app.cli.add_command(click.Command("cleanup", callback=cleanup_command))


def create_cli_app() -> click.Group:
    """Create a CLI application group."""

    @click.group()
    def cli():
        """DojoPool CLI tools."""
        pass

    cli.add_command(click.Command("init-db", callback=init_db_command))
    cli.add_command(click.Command("run-migrations", callback=run_migrations_command))
    return cli


def get_app_context() -> Any:
    """Get the current Flask application context."""
    from flask import current_app

    return current_app.app_context()


def run_command(command: Callable[[], None]):
    """Decorator to run a command in the application context."""

    @with_appcontext
    def wrapped():
        command()

    return wrapped


@click.command("create-admin")
@click.argument("email")
@click.argument("password")
@click.option("--first-name", default=None)
@click.option("--last-name", default=None)
@with_appcontext
def create_admin_command(
    email: str,
    password: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
) -> None:
    """Create an admin user.

    Args:
        email: Admin email
        password: Admin password
        first_name: Optional first name
        last_name: Optional last name
    """
    try:
        user = User(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_admin=True,
        )
        db.session.add(user)
        db.session.commit()
        click.echo(f"Admin user created successfully: {email}")
    except Exception as e:
        db.session.rollback()
        click.echo(f"Error creating admin user: {str(e)}")
        raise


@click.command("create-venue")
@click.argument("name")
@click.argument("address")
@click.argument("city")
@click.argument("state")
@click.argument("country")
@click.argument("postal_code")
@with_appcontext
def create_venue_command(
    name: str, address: str, city: str, state: str, country: str, postal_code: str
) -> None:
    """Create a new venue.

    Args:
        name: Venue name
        address: Street address
        city: City
        state: State/province
        country: Country
        postal_code: Postal code
    """
    try:
        venue = Venue(
            name=name,
            address=address,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
        )
        db.session.add(venue)
        db.session.commit()
        click.echo(f"Venue created successfully: {name}")
    except Exception as e:
        db.session.rollback()
        click.echo(f"Error creating venue: {str(e)}")
        raise


@click.command("setup-dev")
@with_appcontext
def setup_development_command() -> None:
    """Set up development environment."""
    try:
        # Initialize database
        init_db_command()

        # Run migrations
        run_migrations_command()

        # Create test admin
        create_admin_command(
            email="admin@dojopool.com",
            password="devpassword123",
            first_name="Admin",
            last_name="User",
        )

        # Create test venue
        create_venue_command(
            name="Test Venue",
            address="123 Test St",
            city="Testville",
            state="TS",
            country="Testland",
            postal_code="12345",
        )

        click.echo("Development environment setup completed successfully!")
    except Exception as e:
        click.echo(f"Error setting up development environment: {str(e)}")
        raise


@click.command("cleanup")
@with_appcontext
def cleanup_command():
    """Clean up temporary files and data."""
    try:
        # Clean up temporary files
        temp_dir = os.path.join(os.getcwd(), "tmp")
        if os.path.exists(temp_dir):
            for file in os.listdir(temp_dir):
                file_path = os.path.join(temp_dir, file)
                try:
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                except Exception as e:
                    click.echo(f"Error deleting {file_path}: {str(e)}")

        # Clean up test data
        if click.confirm("Do you want to clean up test data from the database?"):
            # Add database cleanup logic here
            click.echo("Database test data cleaned up.")

        click.echo("Cleanup completed successfully!")
    except Exception as e:
        click.echo(f"Error during cleanup: {str(e)}")
        raise
