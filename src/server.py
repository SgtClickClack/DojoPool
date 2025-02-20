import sys

# Ensure the 'src' directory (where your dojopool package lives) is in the Python module search path.
sys.path.insert(0, "src")

from waitress import serve

from dojopool.app import app  # Import your WSGI application

if __name__ == "__main__":
    # Adjusting configuration: limiting threads and setting a connection limit.
    serve(
        app,
        host="0.0.0.0",
        port=8080,
        threads=4,  # Set to 4 threads (adjust based on your CPU cores and load)
        connection_limit=100,  # Limit concurrent connections
    )
