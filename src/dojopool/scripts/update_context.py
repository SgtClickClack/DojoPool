import os
from pathlib import Path
from datetime import datetime
import logging
from typing import List, Dict, Optional
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('context_updates.log'),
        logging.StreamHandler()
    ]
)

class ContextUpdate:
    """Represents a context update that needs to be made."""
    def __init__(self, file_path: str, section: str, content: str, reason: str):
        self.file_path = Path(file_path)
        self.section = section
        self.content = content
        self.reason = reason
        self.timestamp = datetime.now()

    def to_dict(self) -> dict:
        return {
            'file_path': str(self.file_path),
            'section': self.section,
            'content': self.content,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat()
        }

class ContextManager:
    """Manages context updates across the project."""
    def __init__(self):
        self.updates_file = Path('context_updates.yaml')
        self.pending_updates: List[ContextUpdate] = []
        self.load_pending_updates()

    def load_pending_updates(self):
        """Load pending updates from YAML file."""
        if self.updates_file.exists():
            with open(self.updates_file, 'r') as f:
                data = yaml.safe_load(f) or {}
                for update in data.get('pending_updates', []):
                    self.pending_updates.append(ContextUpdate(
                        update['file_path'],
                        update['section'],
                        update['content'],
                        update['reason']
                    ))

    def save_pending_updates(self):
        """Save pending updates to YAML file."""
        data = {
            'last_updated': datetime.now().isoformat(),
            'pending_updates': [update.to_dict() for update in self.pending_updates]
        }
        with open(self.updates_file, 'w') as f:
            yaml.dump(data, f, default_flow_style=False)

    def add_update(self, file_path: str, section: str, content: str, reason: str):
        """Add a new context update."""
        update = ContextUpdate(file_path, section, content, reason)
        self.pending_updates.append(update)
        self.save_pending_updates()
        
        # Log the update
        logging.info(f"New context update added for {file_path}")
        logging.info(f"Section: {section}")
        logging.info(f"Reason: {reason}")

        # Update development tracking
        self._update_development_tracking(update)

    def _update_development_tracking(self, update: ContextUpdate):
        """Update the development tracking file with context changes."""
        tracking_file = Path('docs/DEVELOPMENT_TRACKING.md')
        if not tracking_file.exists():
            return

        content = tracking_file.read_text()
        new_entry = f"\n### Context Updates\n- Updated `{update.file_path}` - {update.section}\n  - Reason: {update.reason}\n"

        # Add the update under today's date or create a new entry
        if "# Development Tracking" in content:
            # Find today's date section or create it
            today = datetime.now().strftime("%Y-%m-%d")
            if f"## {today}" in content:
                # Add under existing date
                parts = content.split(f"## {today}")
                content = f"{parts[0]}## {today}\n{new_entry}{parts[1]}"
            else:
                # Create new date section
                content = f"{content}\n\n## {today}\n{new_entry}"
        else:
            content = f"# Development Tracking\n\n## {datetime.now().strftime('%Y-%m-%d')}\n{new_entry}"

        tracking_file.write_text(content)

    def check_required_updates(self) -> List[str]:
        """Check for files that likely need updates based on recent changes."""
        required_updates = []
        
        # Check development tracking
        tracking_file = Path('docs/DEVELOPMENT_TRACKING.md')
        if tracking_file.exists():
            last_modified = datetime.fromtimestamp(tracking_file.stat().st_mtime)
            if (datetime.now() - last_modified).days > 1:
                required_updates.append("Development tracking needs to be updated")

        # Check documentation index
        index_file = Path('docs/DOCUMENTATION_INDEX.md')
        if index_file.exists() and self.pending_updates:
            required_updates.append("Documentation index may need updates due to pending changes")

        return required_updates

    def generate_update_reminders(self):
        """Generate reminders for context updates."""
        logging.info("\nContext Update Reminders")
        logging.info("=======================")

        if self.pending_updates:
            logging.info("\nPending Updates:")
            for update in self.pending_updates:
                logging.info(f"\nFile: {update.file_path}")
                logging.info(f"Section: {update.section}")
                logging.info(f"Reason: {update.reason}")
                logging.info(f"Added: {update.timestamp}")

        required = self.check_required_updates()
        if required:
            logging.info("\nRequired Updates:")
            for update in required:
                logging.info(f"- {update}")

def main():
    """Main function to manage context updates."""
    manager = ContextManager()
    
    # Example usage:
    # manager.add_update(
    #     "docs/DEVELOPMENT_TRACKING.md",
    #     "Current Sprint",
    #     "Added new feature X",
    #     "Implementation of feature X completed"
    # )
    
    manager.generate_update_reminders()

if __name__ == '__main__':
    main() 