import os
import sys
from pathlib import Path

def get_unique_backup_path(file_path: Path) -> Path:
    """Get a unique backup file path."""
    base = file_path.with_suffix(file_path.suffix + '.bak')
    if not base.exists():
        return base
    
    counter = 1
    while True:
        new_path = file_path.with_suffix(f"{file_path.suffix}.bak{counter}")
        if not new_path.exists():
            return new_path
        counter += 1

def fix_workflow_file(file_path: Path) -> None:
    """Fix critical issues in workflow files."""
    print(f"Processing: {file_path}")
    backup_path = None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        fixed_lines = []
        for line in lines:
            # Fix 'true:' to 'on:'
            if line.strip() == 'true:':
                line = line.replace('true:', 'on:')
            
            # Fix template literals
            if '${' in line and not '${{' in line:
                line = line.replace('${', '${{')
                line = line.replace('}', '}}')
            
            # Fix double curly braces
            line = line.replace('${{{{', '${{')
            line = line.replace('}}}}', '}}')
            
            # Fix unclosed quotes in globs
            if "'**/*.txt'" in line:
                line = line.replace("'**/*.txt'", '"**/*.txt"')
            
            # Fix path quotes
            if "path: '~/.npm'" in line:
                line = line.replace("path: '~/.npm'", 'path: ~/.npm')
            
            fixed_lines.append(line)
        
        # Create backup with unique name
        backup_path = get_unique_backup_path(file_path)
        os.rename(file_path, backup_path)
        
        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)
            
        print(f"✅ Fixed: {file_path}")
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        if backup_path and backup_path.exists():
            try:
                os.rename(backup_path, file_path)
            except Exception as restore_error:
                print(f"Failed to restore backup: {str(restore_error)}")

def main():
    """Process all workflow files."""
    repo_root = Path(__file__).parent.parent
    workflows_dir = repo_root / '.github' / 'workflows'
    
    if not workflows_dir.exists():
        print("❌ Workflows directory not found!")
        sys.exit(1)
    
    workflow_files = list(workflows_dir.glob('*.yml'))
    if not workflow_files:
        print("No workflow files found!")
        sys.exit(1)
    
    print(f"Found {len(workflow_files)} workflow files...")
    
    for workflow_file in workflow_files:
        fix_workflow_file(workflow_file)
    
    print("\n✨ Done!")

if __name__ == '__main__':
    main() 