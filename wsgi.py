# C:\dev\DojoPoolONE\wsgi.py
import sys
import os

# Add src directory to Python path
src_path = os.path.join(os.path.dirname(__file__), 'DojoPool', 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from dojopool.app import create_app

app = create_app()

if __name__ == "__main__":
    # Note: This won't run with SocketIO correctly,
    # it's just for Flask CLI commands.
    app.run() 