import os
import logging
import jwt
from datetime import datetime, timedelta
from functools import wraps
import time
import json
from dotenv import load_dotenv
from docx import Document

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define workspace paths
workspace1 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo_Pool_fresh"
workspace2 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo Pool"
workspace3 = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\Dojo Pool"  # Assuming this is the same as workspace2
combined_workspace = r"C:\Users\JR\Documents\DojoPool\DojoPoolCombined\combined"

# Path to store processed files
processed_files_path = os.path.join(combined_workspace, 'processed_files.json')

def load_processed_files():
    """
    Load the set of processed files from a JSON file.
    """
    if os.path.exists(processed_files_path):
        with open(processed_files_path, 'r') as f:
            return set(json.load(f))
    return set()

def save_processed_files(processed_files):
    """
    Save the set of processed files to a JSON file.
    """
    with open(processed_files_path, 'w') as f:
        json.dump(list(processed_files), f)

def list_files_in_workspace(workspace):
    """
    Lists all files in the specified workspace directory.

    :param workspace: The path to the workspace directory.
    """
    if not os.path.exists(workspace):
        logging.error(f"Workspace does not exist: {workspace}")
        return

    try:
        files = os.listdir(workspace)
        file_count = len(files)  # Count the number of files
        if files:
            logging.info(f"Files in {workspace} ({file_count} total):")
            for file in files:
                logging.info(f" - {file}")
        else:
            logging.info(f"No files found in {workspace}.")
            logging.info(f"{workspace} is empty.")

    except PermissionError:
        logging.error(f"Permission denied accessing {workspace}.")
    except Exception as e:
        logging.error(f"Error accessing {workspace}: {e}")

def process_files(workspace, processed_files):
    """
    Process files in the specified workspace, avoiding duplicates.

    :param workspace: The path to the workspace directory.
    :param processed_files: A set of already processed files.
    """
    if not os.path.exists(workspace):
        logging.error(f"Workspace does not exist: {workspace}")
        return

    try:
        files = os.listdir(workspace)
        for file in files:
            if file in processed_files:
                logging.info(f"Already processed: {file}. Skipping.")
                continue
            # Add the file to the processed set
            processed_files.add(file)

            file_path = os.path.join(workspace, file)

            # Determine file type and process accordingly
            if file.endswith('.py'):
                logging.info(f"Processing Python file: {file}")
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    # Add your processing logic here
                except Exception as e:
                    logging.error(f"Failed to process {file}: {e}")
            elif file.endswith('.docx'):
                logging.info(f"Processing document file: {file}")
                try:
                    doc = Document(file_path)
                    text = '\n'.join([para.text for para in doc.paragraphs])
                    logging.info(f"Extracted text from {file}:")
                    logging.info(text)
                    # Add your processing logic here
                except Exception as e:
                    logging.error(f"Failed to process {file}: {e}")
            else:
                logging.info(f"Processing file: {file}")
                # General processing logic

    except Exception as e:
        logging.error(f"Error processing files in {workspace}: {e}")

def main():
    """
    Main function to list and process files in all defined workspaces.
    """
    workspaces = [workspace1, workspace2, workspace3, combined_workspace]
    # Load already processed files
    processed_files = load_processed_files()
    for workspace in workspaces:
        list_files_in_workspace(workspace)
        process_files(workspace, processed_files)
    # Save the updated set of processed files
    save_processed_files(processed_files)

class APIHandler:
    rate_limits = {
        'places': {'limit': 5, 'reset_time': 3600}  # 5 requests per hour
    }
    
    def __init__(self):
        self.requests = {}

    def rate_limiter(self, key):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                current_time = time.time()
                if key not in self.requests:
                    self.requests[key] = []
                
                # Remove expired requests
                self.requests[key] = [t for t in self.requests[key] if t > current_time - self.rate_limits[key]['reset_time']]
                
                if len(self.requests[key]) >= self.rate_limits[key]['limit']:
                    raise Exception("Rate limit exceeded for places API")
                
                self.requests[key].append(current_time)
                return await func(*args, **kwargs)
            return wrapper
        return decorator

    def generate_jwt(self, avatar_name):
        secret = os.getenv("JWT_SECRET")
        if not secret:
            return None
        
        try:
            payload = {
                'avatar_name': avatar_name,
                'exp': datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
            }
            token = jwt.encode(payload, secret, algorithm='HS256')
            return token
        except Exception as e:
            logging.error(f"Error generating JWT: {str(e)}")
            return None

    def verify_jwt(self, token):
        secret = os.getenv("JWT_SECRET")
        if not secret:
            return None
        
        try:
            payload = jwt.decode(token, secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logging.warning("JWT token has expired.")
            return None
        except jwt.InvalidTokenError:
            logging.warning("Invalid JWT token.")
            return None

if __name__ == "__main__":
    main()