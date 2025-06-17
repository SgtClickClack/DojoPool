#!/usr/bin/env python3
"""
Development Tracking Helper Script
Ensures correct tracking files are updated and provides validation.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional

class DevTrackingHelper:
    """Helper class for development tracking file management."""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        self.correct_tracking_dir = self.project_root / "docs" / "planning" / "tracking"
        self.legacy_files = [
            self.project_root / "DEVELOPMENT_TRACKING_PART_03.md",
            self.project_root / "DEVELOPMENT_TRACKING_PART_04.md",
            self.project_root / "docs" / "DEVELOPMENT_TRACKING.md"
        ]
        
    def get_correct_tracking_files(self) -> Dict[str, Path]:
        """Get the correct tracking files that should be updated."""
        files = {}
        if self.correct_tracking_dir.exists():
            for file_path in self.correct_tracking_dir.glob("*.md"):
                if file_path.name.startswith(("part-", "index")):
                    files[file_path.name] = file_path
        return files
    
    def get_legacy_files(self) -> List[Path]:
        """Get legacy tracking files that should NOT be updated."""
        return [f for f in self.legacy_files if f.exists()]
    
    def validate_tracking_structure(self) -> Dict[str, any]:
        """Validate the tracking file structure."""
        result = {
            "correct_files": self.get_correct_tracking_files(),
            "legacy_files": self.get_legacy_files(),
            "has_index": False,
            "has_parts": False,
            "warnings": []
        }
        
        # Check for index file
        index_file = self.correct_tracking_dir / "index.md"
        if index_file.exists():
            result["has_index"] = True
            result["correct_files"]["index.md"] = index_file
        
        # Check for part files
        part_files = [f for f in result["correct_files"].keys() if f.startswith("part-")]
        if part_files:
            result["has_parts"] = True
        
        # Generate warnings
        if not result["has_index"]:
            result["warnings"].append("Missing index.md in tracking directory")
        if not result["has_parts"]:
            result["warnings"].append("No part-*.md files found in tracking directory")
        if result["legacy_files"]:
            result["warnings"].append(f"Found {len(result['legacy_files'])} legacy files that should NOT be updated")
        
        return result
    
    def print_status(self):
        """Print current tracking file status."""
        print("🔍 Development Tracking File Status")
        print("=" * 50)
        
        validation = self.validate_tracking_structure()
        
        print("\n✅ CORRECT FILES TO UPDATE:")
        if validation["correct_files"]:
            for name, path in validation["correct_files"].items():
                print(f"  📄 {name} -> {path}")
        else:
            print("  ❌ No correct tracking files found!")
        
        print("\n⚠️  LEGACY FILES (DO NOT UPDATE):")
        if validation["legacy_files"]:
            for path in validation["legacy_files"]:
                print(f"  🚫 {path}")
        else:
            print("  ✅ No legacy files found")
        
        print("\n📋 VALIDATION RESULTS:")
        print(f"  Has index file: {'✅' if validation['has_index'] else '❌'}")
        print(f"  Has part files: {'✅' if validation['has_parts'] else '❌'}")
        
        if validation["warnings"]:
            print("\n⚠️  WARNINGS:")
            for warning in validation["warnings"]:
                print(f"  • {warning}")
        
        print("\n" + "=" * 50)
    
    def get_next_part_file(self) -> Optional[Path]:
        """Get the next part file that should be updated."""
        correct_files = self.get_correct_tracking_files()
        part_files = [(name, path) for name, path in correct_files.items() if name.startswith("part-")]
        
        if not part_files:
            return None
        
        # Sort by part number and return the highest
        part_files.sort(key=lambda x: x[0])
        return part_files[-1][1]
    
    def create_update_template(self, feature_name: str, description: str) -> str:
        """Create a template for updating tracking files."""
        next_file = self.get_next_part_file()
        if not next_file:
            return "❌ No tracking files found!"
        
        template = f"""### {self._get_current_date()}: {feature_name}

**Description:**
{description}

**Core Components Implemented:**
- Component 1 - Description
- Component 2 - Description
- Component 3 - Description

**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**Integration Points:**
- Integrates with existing service X
- Connects with component Y
- Supports integration Z

**File Paths:**
- src/path/to/component1.ts
- src/path/to/component2.tsx
- src/pages/path/to/page.tsx

**Technical Implementation:**
- Technical detail 1
- Technical detail 2
- Technical detail 3

**Next Priority Task:**
Implement next feature

Expected completion time: X hours

"""
        return template
    
    def _get_current_date(self) -> str:
        """Get current date in YYYY-MM-DD format."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d")
    
    def check_file_exists(self, file_path: str) -> bool:
        """Check if a file exists and is in the correct location."""
        path = Path(file_path)
        if not path.is_absolute():
            path = self.project_root / path
        
        return path.exists()
    
    def suggest_correct_file(self, attempted_file: str) -> Optional[Path]:
        """Suggest the correct file when wrong file is attempted."""
        attempted_path = Path(attempted_file)
        
        # If it's a legacy file, suggest the correct one
        if attempted_path in self.legacy_files:
            return self.get_next_part_file()
        
        # If it's not in the correct directory, suggest the correct one
        if not str(attempted_path).startswith(str(self.correct_tracking_dir)):
            return self.get_next_part_file()
        
        return None

def main():
    """Main function for command line usage."""
    helper = DevTrackingHelper()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            helper.print_status()
        elif command == "template":
            if len(sys.argv) < 4:
                print("Usage: python dev-tracking-helper.py template 'Feature Name' 'Description'")
                return
            feature_name = sys.argv[2]
            description = sys.argv[3]
            template = helper.create_update_template(feature_name, description)
            print(template)
        elif command == "next":
            next_file = helper.get_next_part_file()
            if next_file:
                print(f"Next file to update: {next_file}")
            else:
                print("No tracking files found!")
        elif command == "validate":
            validation = helper.validate_tracking_structure()
            if validation["warnings"]:
                print("❌ Validation failed!")
                for warning in validation["warnings"]:
                    print(f"  • {warning}")
            else:
                print("✅ Validation passed!")
        else:
            print("Unknown command. Use: status, template, next, or validate")
    else:
        helper.print_status()

if __name__ == "__main__":
    main() 