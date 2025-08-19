"""WSGI entry point."""

# Production WSGI entrypoint for DojoPoolONE
from dojopool.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
