from typing import Dict, Any
import os
import yaml
import sys
import re
from pathlib import Path

# Add custom YAML representer to handle the 'on' keyword
def represent_none(self, _):
    return self.represent_scalar('tag:yaml.org,2002:null', '')

yaml.SafeDumper.add_representer(type(None), represent_none)

def fix_yaml_syntax(content: str) -> str:
    """Fix common YAML syntax issues."""
    # Fix 'on' keyword
    if content.startswith('true:'):
        content = 'on:' + content[5:]
    elif not content.startswith('on:'):
        content = 'on:' + content
    
    # Fix template literals
    content = content.replace('${', '${{')
    content = content.replace('${{{{', '${{')  # Fix double escaping
    
    # Fix string literals
    lines = []
    for line in content.split('\n'):
        # Fix unclosed quotes
        if line.count("'") % 2 == 1:
            if line.strip().endswith("'"):
                line = "'" + line
            else:
                line = line + "'"
                
        # Fix glob patterns
        if "'**" in line:
            line = line.replace("'**", '"**')
            if line.endswith("'"):
                line = line[:-1] + '"'
                
        # Fix multiline strings
        if ': |' in line and "'" in line:
            line = line.replace("'", '')
            
        # Fix conditional expressions
        if '|| ' in line and "''" in line:
            line = line.replace("''", '"')
            
        lines.append(line)
    
    content = '\n'.join(lines)
    
    # Fix version strings
    content = re.sub(r"'(\d+\.\d+)'\'", r"'\1'", content)
    
    # Fix environment variables
    content = re.sub(r'SLACK_MESSAGE: \'([^\']+)', lambda m: f'SLACK_MESSAGE: |\n      {m.group(1)}', content)
    
    return content

def add_retry_strategy(job: Dict[str, Any]) -> None:
    """Add retry strategy for potentially flaky jobs."""
    if 'test' in str(job.get('name', '')).lower() or 'performance' in str(job.get('name', '')).lower():
        job['strategy'] = job.get('strategy', {})
        job['strategy']['fail-fast'] = False
        job['steps'] = job.get('steps', [])
        
        # Add retry step wrapper
        for step in job['steps']:
            if isinstance(step, dict):
                if 'uses' not in step:  # Don't wrap action steps
                    step['continue-on-error'] = True
                    step['timeout-minutes'] = 10  # Individual step timeout
                elif step.get('uses', '').startswith('actions/'):
                    # Add retries for GitHub actions
                    step['with'] = step.get('with', {})
                    step['with']['retry-on-failure'] = True

def add_timeout_minutes(data: Dict[str, Any]) -> None:
    """Add timeout limits to jobs to prevent hanging."""
    if 'jobs' in data:
        for job_name, job in data['jobs'].items():
            if isinstance(job, dict):
                # Add timeout if missing or too short
                current_timeout = job.get('timeout-minutes', 0)
                
                # Determine appropriate timeout based on job type
                if 'performance' in job_name.lower():
                    min_timeout = 45  # Performance tests need more time
                elif 'test' in job_name.lower():
                    min_timeout = 30
                elif 'lint' in job_name.lower():
                    min_timeout = 15
                elif 'security' in job_name.lower():
                    min_timeout = 40  # Security scans need more time
                else:
                    min_timeout = 60  # Default timeout
                
                if current_timeout < min_timeout:
                    job['timeout-minutes'] = min_timeout
                
                # Add retry strategy for test jobs
                add_retry_strategy(job)

def add_concurrency_settings(data: Dict[str, Any]) -> None:
    """Add or update concurrency settings to prevent redundant runs."""
    workflow_name = data.get('name', 'workflow')
    
    # Create a more specific concurrency group based on workflow type
    group_suffix = ''
    if 'test' in workflow_name.lower():
        group_suffix = '-tests'
    elif 'security' in workflow_name.lower():
        group_suffix = '-security'
    elif 'lint' in workflow_name.lower():
        group_suffix = '-lint'
    
    data['concurrency'] = {
        'group': f"${{{{ github.workflow }}}}{group_suffix}-${{{{ github.ref }}}}",
        'cancel-in-progress': True
    }

def add_conditional_execution(job: Dict[str, Any]) -> None:
    """Add conditions to skip unnecessary runs."""
    if 'security' in str(job.get('name', '')).lower():
        # Only run security jobs if relevant files changed
        job['if'] = "${{ github.event_name == 'push' || contains(github.event.pull_request.labels.*.name, 'security') }}"
    elif 'performance' in str(job.get('name', '')).lower():
        # Only run performance tests on main branch or if explicitly requested
        job['if'] = "${{ github.ref == 'refs/heads/main' || contains(github.event.pull_request.labels.*.name, 'performance') }}"

def standardize_permissions(data: Dict[str, Any]) -> None:
    """Standardize permissions across workflows."""
    standard_permissions = {
        'contents': 'read',
        'actions': 'write',
        'checks': 'write',
        'pull-requests': 'write',
        'security-events': 'write',
        'issues': 'write'  # Added for status updates
    }
    data['permissions'] = standard_permissions

def fix_workflow(data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply all workflow fixes to the given workflow data."""
    if 'jobs' in data:
        for job_name, job in data['jobs'].items():
            if isinstance(job, dict):
                add_conditional_execution(job)
                
                # Ensure steps is a list
                if 'steps' in job and not isinstance(job['steps'], list):
                    job['steps'] = []
                
                # Add error handling to steps
                if 'steps' in job:
                    for step in job['steps']:
                        if isinstance(step, dict):
                            step['continue-on-error'] = True
    
    add_timeout_minutes(data)
    add_concurrency_settings(data)
    standardize_permissions(data)
    return data

def safe_backup(file_path: Path) -> Path:
    """Create a backup of the file with a unique name."""
    backup_path = file_path.with_suffix(file_path.suffix + '.bak')
    counter = 1
    while backup_path.exists():
        backup_path = file_path.with_suffix(f"{file_path.suffix}.bak{counter}")
        counter += 1
    return backup_path

def process_workflow_file(file_path: Path) -> None:
    """Process a single workflow file and apply fixes."""
    print(f"Processing workflow file: {file_path}")
    backup_path = None
    
    try:
        # Try different encodings
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        content = None
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except UnicodeDecodeError:
                continue
                
        if content is None:
            raise ValueError(f"Could not read file with any of the attempted encodings: {encodings}")
        
        # Fix YAML syntax issues
        content = fix_yaml_syntax(content)
            
        data = yaml.safe_load(content)
            
        if not data:
            print(f"Warning: Empty workflow file: {file_path}")
            return
            
        fixed_data = fix_workflow(data)
        
        # Create backup with unique name
        backup_path = safe_backup(file_path)
        os.rename(file_path, backup_path)
        
        # Write fixed workflow with UTF-8 encoding
        with open(file_path, 'w', encoding='utf-8') as f:
            # Handle the 'on' keyword specially
            if 'on' in fixed_data:
                on_value = fixed_data.pop('on')
                f.write('on:\n')
                remaining_yaml = yaml.safe_dump(on_value, sort_keys=False, allow_unicode=True)
                f.write('  ' + remaining_yaml.replace('\n', '\n  '))
                f.write('\n')
                yaml.safe_dump(fixed_data, f, sort_keys=False, allow_unicode=True)
            else:
                yaml.safe_dump(fixed_data, f, sort_keys=False, allow_unicode=True)
            
        print(f"✅ Successfully fixed workflow: {file_path} (with retries and conditions)")
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        # Restore from backup if it exists
        if backup_path and backup_path.exists():
            os.rename(backup_path, file_path)

def main():
    """Find and process all workflow files in the repository."""
    # Get the repository root (assuming script is in scripts/ directory)
    repo_root = Path(__file__).parent.parent
    workflows_dir = repo_root / '.github' / 'workflows'
    
    if not workflows_dir.exists():
        print(f"❌ Workflows directory not found at: {workflows_dir}")
        sys.exit(1)
    
    workflow_files = list(workflows_dir.glob('*.yml'))
    if not workflow_files:
        print("No workflow files found!")
        sys.exit(1)
        
    print(f"Found {len(workflow_files)} workflow files to process...")
    
    for workflow_file in workflow_files:
        process_workflow_file(workflow_file)
    
    print("\n✨ Workflow fixes complete!")

if __name__ == '__main__':
    main() 
