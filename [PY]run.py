"""
Run the Flask application.
"""

from src.dojopool.app import create_app
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Ensure the instance folder exists
    os.makedirs('instance', exist_ok=True)
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)