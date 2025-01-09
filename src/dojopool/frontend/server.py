"""Simple HTTP server for testing PWA."""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys
import logging
import mimetypes
import socket

# Add proper MIME types
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('application/manifest+json', '.json')

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PWAHandler(SimpleHTTPRequestHandler):
    """Custom handler for PWA testing."""
    
    def __init__(self, *args, **kwargs):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = os.path.join(current_dir, 'public')
        logger.info(f"Base directory set to: {self.base_dir}")
        super().__init__(*args, **kwargs)
    
    def translate_path(self, path):
        """Translate URL paths into filesystem paths."""
        logger.info(f"Translating path: {path}")
        # Remove query parameters and fragments
        path = path.split('?', 1)[0].split('#', 1)[0]
        # Remove leading slash
        path = path.lstrip('/')
        # If path is empty, serve test-pwa.html
        if not path:
            path = 'test-pwa.html'
        # Join with base directory
        path = os.path.join(self.base_dir, path)
        logger.info(f"Translated to filesystem path: {path}")
        return path
    
    def do_GET(self):
        """Handle GET requests."""
        logger.info(f"GET request received for path: {self.path}")
        logger.info(f"Headers: {self.headers}")
        
        # Get the filesystem path
        file_path = self.translate_path(self.path)
        logger.info(f"Looking for file at: {file_path}")
        
        if os.path.exists(file_path):
            logger.info(f"File exists: {file_path}")
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                    self.send_response(200)
                    
                    # Set correct content type
                    if self.path.endswith('.js'):
                        self.send_header('Content-Type', 'application/javascript')
                    elif self.path.endswith('.json'):
                        self.send_header('Content-Type', 'application/json')
                    elif self.path.endswith('.html'):
                        self.send_header('Content-Type', 'text/html')
                    elif self.path.endswith('.css'):
                        self.send_header('Content-Type', 'text/css')
                    elif self.path.endswith('.png'):
                        self.send_header('Content-Type', 'image/png')
                    elif self.path.endswith('.svg'):
                        self.send_header('Content-Type', 'image/svg+xml')
                    
                    self.send_header('Content-Length', len(content))
                    self.end_headers()
                    self.wfile.write(content)
                    logger.info(f"Successfully served file: {self.path}")
                    return
            except Exception as e:
                logger.error(f"Error serving file {file_path}: {e}", exc_info=True)
                self.send_error(500, f"Error serving file: {str(e)}")
                return
        else:
            logger.error(f"File not found: {file_path}")
            # Try serving test-pwa.html for root path
            if self.path == '/':
                alternative_path = os.path.join(self.base_dir, 'test-pwa.html')
                if os.path.exists(alternative_path):
                    logger.info(f"Serving test-pwa.html instead")
                    try:
                        with open(alternative_path, 'rb') as f:
                            content = f.read()
                            self.send_response(200)
                            self.send_header('Content-Type', 'text/html')
                            self.send_header('Content-Length', len(content))
                            self.end_headers()
                            self.wfile.write(content)
                            logger.info("Successfully served test-pwa.html")
                            return
                    except Exception as e:
                        logger.error(f"Error serving test-pwa.html: {e}", exc_info=True)
            
            self.send_error(404, f"File not found: {self.path}")
            return
    
    def end_headers(self):
        """Add CORS and security headers."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

def run_server(port=8000):
    """Run the server."""
    try:
        # Get local IP address
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        logger.info(f"Local IP address: {local_ip}")
        
        # List available files
        current_dir = os.path.dirname(os.path.abspath(__file__))
        public_dir = os.path.join(current_dir, 'public')
        logger.info(f"Public directory: {public_dir}")
        if os.path.exists(public_dir):
            logger.info("Available files:")
            for file in os.listdir(public_dir):
                logger.info(f"  - {file}")
        else:
            logger.error(f"Public directory not found: {public_dir}")
            sys.exit(1)
        
        # Set up the server
        server_address = ('', port)  # Empty string means bind to all available interfaces
        httpd = HTTPServer(server_address, PWAHandler)
        
        logger.info(f"Server is available at:")
        logger.info(f"  - http://localhost:{port}/test-pwa.html")
        logger.info(f"  - http://{local_ip}:{port}/test-pwa.html")
        logger.info("Press Ctrl+C to stop the server")
        
        httpd.serve_forever()
        
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    run_server() 