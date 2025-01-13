import os
from pathlib import Path
from datetime import datetime, timedelta
import yaml
import json
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ContextSummarizer:
    """Generates summaries of recent project context."""
    
    def __init__(self):
        self.base_path = Path('.')
        self.recent_changes: List[Dict] = []
        self.critical_updates: List[Dict] = []
        self.performance_metrics = {}
        self.load_data()

    def load_data(self):
        """Load data from various tracking files."""
        # Load context updates
        updates_file = self.base_path / 'context_updates.yaml'
        if updates_file.exists():
            with open(updates_file) as f:
                data = yaml.safe_load(f) or {}
                self.recent_changes = data.get('pending_updates', [])

        # Load performance metrics
        metrics_file = self.base_path / 'performance_metrics.json'
        if metrics_file.exists():
            with open(metrics_file) as f:
                self.performance_metrics = json.load(f)

        # Load pinned files status
        status_file = self.base_path / 'pinned_files_status.yaml'
        if status_file.exists():
            with open(status_file) as f:
                data = yaml.safe_load(f) or {}
                for file_info in data.get('files', {}).values():
                    if file_info.get('priority') == 'High' and file_info.get('status') != 'Current':
                        self.critical_updates.append(file_info)

    def get_recent_development(self) -> str:
        """Get recent development activities."""
        dev_file = self.base_path / 'docs' / 'DEVELOPMENT_TRACKING.md'
        if not dev_file.exists():
            return "No recent development tracking found."

        content = dev_file.read_text()
        # Get the most recent date section
        sections = content.split('##')
        if len(sections) > 1:
            return f"## Recent Development\n{sections[1].strip()}"
        return "No recent development entries found."

    def get_performance_summary(self) -> str:
        """Generate performance metrics summary."""
        if not self.performance_metrics:
            return "No performance data available."

        latest = self.performance_metrics.get('latest', {})
        return f"""
## Performance Summary
- Total Images: {latest.get('total_images', 'N/A')}
- Space Saved: {latest.get('space_saved', 'N/A')} MB
- WebP Adoption: {latest.get('webp_adoption_rate', 'N/A')}%
- Lazy Loading: {latest.get('lazy_loading_rate', 'N/A')}%
"""

    def get_critical_updates(self) -> str:
        """Get critical updates that need attention."""
        if not self.critical_updates:
            return "No critical updates pending."

        updates = "\n".join([
            f"- {update.get('path', 'Unknown')}: {update.get('status', 'Unknown')}"
            for update in self.critical_updates
        ])
        return f"## Critical Updates Needed\n{updates}"

    def get_recent_changes(self) -> str:
        """Get recent context changes."""
        if not self.recent_changes:
            return "No recent context changes."

        # Filter to last 24 hours
        recent = [
            change for change in self.recent_changes
            if datetime.fromisoformat(change['timestamp']) > datetime.now() - timedelta(days=1)
        ]
        
        if not recent:
            return "No changes in the last 24 hours."

        changes = "\n".join([
            f"- {change['file_path']} ({change['section']}): {change['reason']}"
            for change in recent
        ])
        return f"## Recent Changes (24h)\n{changes}"

    def generate_summary(self) -> str:
        """Generate a complete context summary."""
        sections = [
            "# Project Context Summary",
            self.get_recent_development(),
            self.get_critical_updates(),
            self.get_recent_changes(),
            self.get_performance_summary()
        ]
        
        summary = "\n\n".join(sections)
        
        # Save the summary
        summary_file = self.base_path / 'context_summary.md'
        summary_file.write_text(summary)
        
        logging.info(f"Context summary generated and saved to {summary_file}")
        return summary

def main():
    summarizer = ContextSummarizer()
    print(summarizer.generate_summary())

if __name__ == '__main__':
    main() 