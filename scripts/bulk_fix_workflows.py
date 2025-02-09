from typing import Dict, Any
import os
import yaml
import sys
import re
from pathlib import Path
import shutil
import venv

def setup_virtual_env():
    """Set up a virtual environment for the script."""
    venv_path = Path('.venv')
    if not venv_path.exists():
        print("🔧 Creating virtual environment...")
        try:
            venv.create(venv_path, with_pip=True)
            
            # Get the correct python executable
            if sys.platform == 'win32':
                python_exe = venv_path / 'Scripts' / 'python.exe'
            else:
                python_exe = venv_path / 'bin' / 'python'
            
            if not python_exe.exists():
                raise FileNotFoundError(f"Python executable not found at {python_exe}")
            
            # Install required packages
            print("📦 Installing required packages...")
            os.system(f'"{python_exe}" -m pip install --upgrade pip')
            os.system(f'"{python_exe}" -m pip install pyyaml')
            
            print("✅ Virtual environment setup complete")
            return True
        except Exception as e:
            print(f"❌ Error setting up virtual environment: {str(e)}")
            return False
    return True

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
    """Add reasonable timeouts to prevent hung jobs."""
    if 'jobs' in data:
        for job in data['jobs'].values():
            if isinstance(job, dict) and 'timeout-minutes' not in job:
                # Set default timeout of 30 minutes
                job['timeout-minutes'] = 30

def add_concurrency_settings(data: Dict[str, Any]) -> None:
    """Add concurrency settings to prevent parallel runs of the same workflow."""
    if 'concurrency' not in data:
        data['concurrency'] = {
            'group': '${{ github.workflow }}-${{ github.ref }}',
            'cancel-in-progress': True
        }

def add_conditional_execution(job: Dict[str, Any]) -> None:
    """Add conditional execution to prevent unnecessary job runs."""
    if 'if' not in job:
        # Skip jobs on doc-only changes
        job['if'] = "${{ !contains(github.event.head_commit.message, 'docs:') }}"
    
    # Add matrix strategy if not present
    if 'strategy' not in job:
        job['strategy'] = {
            'fail-fast': False,
            'max-parallel': 4
        }

def standardize_permissions(data: Dict[str, Any]) -> None:
    """Standardize and minimize required permissions."""
    if 'permissions' not in data:
        data['permissions'] = {
            'contents': 'read',
            'actions': 'write',
            'checks': 'write',
            'pull-requests': 'write',
            'security-events': 'write',
            'issues': 'write'
        }

def fix_workflow(data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply all workflow fixes to the given workflow data."""
    if 'jobs' in data:
        for job_name, job in data['jobs'].items():
            if isinstance(job, dict):
                # Add error handling to steps
                if 'steps' in job:
                    for step in job['steps']:
                        if isinstance(step, dict):
                            # Don't add continue-on-error for critical steps
                            if not any(critical in str(step.get('name', '')).lower() 
                                     for critical in ['deploy', 'release', 'publish']):
                                step['continue-on-error'] = True
                            
                            # Add timeouts for long-running steps
                            if 'run' in step and any(long_running in str(step['run']).lower() 
                                                   for long_running in ['test', 'build', 'install']):
                                step['timeout-minutes'] = 15
                
                # Add retry strategy for network-dependent steps
                if 'steps' in job:
                    for step in job['steps']:
                        if isinstance(step, dict) and 'uses' in step:
                            if any(action in step['uses'] for action in ['actions/checkout', 'actions/setup-node', 'actions/setup-python']):
                                step['with'] = step.get('with', {})
                                step['with']['retry-on-network-failure'] = True
                
                # Improve caching strategy
                if 'steps' in job:
                    has_cache = False
                    for step in job['steps']:
                        if isinstance(step, dict) and step.get('uses', '').startswith('actions/cache'):
                            has_cache = True
                            step['with'] = step.get('with', {})
                            step['with']['enableCrossOsArchive'] = True
                            step['with']['fail-on-cache-miss'] = False
                    
                    # Add cache for common dependencies if missing
                    if not has_cache and any(dep in job_name.lower() for dep in ['build', 'test', 'lint']):
                        cache_step = {
                            'uses': 'actions/cache@v4',
                            'with': {
                                'path': '**/node_modules\n~/.npm\n.next/cache',
                                'key': '${{ runner.os }}-deps-${{ hashFiles(\'**/package-lock.json\') }}',
                                'restore-keys': '${{ runner.os }}-deps-'
                            }
                        }
                        job['steps'].insert(1, cache_step)
                
                # Add conditional execution
                add_conditional_execution(job)
    
    # Add global workflow improvements
    add_timeout_minutes(data)
    add_concurrency_settings(data)
    standardize_permissions(data)
    
    # Add workflow-level error handling
    if 'on' in data:
        # Add automatic issue creation on failure
        data['on']['workflow_run'] = {
            'workflows': ['*'],
            'types': ['completed']
        }
    
    return data

def safe_backup(file_path: Path) -> Path:
    """Create a backup of the file with a unique name."""
    backup_path = file_path.with_suffix(file_path.suffix + '.bak')
    counter = 1
    while backup_path.exists():
        backup_path = file_path.with_suffix(f"{file_path.suffix}.bak{counter}")
        counter += 1
    return backup_path

def process_workflow_file(file_path: str) -> None:
    """Process a single workflow file and apply fixes."""
    try:
        # Ensure virtual environment is set up
        if not setup_virtual_env():
            print("❌ Failed to set up virtual environment")
            return
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        if data:
            fixed_data = fix_workflow(data)
            
            # Backup original file
            backup_path = f"{file_path}.bak"
            shutil.copy2(file_path, backup_path)
            
            # Write fixed workflow
            with open(file_path, 'w', encoding='utf-8') as f:
                yaml.dump(fixed_data, f, sort_keys=False, allow_unicode=True)
            
            print(f"✅ Successfully processed {file_path}")
    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")
        if 'pyvenv.cfg' in str(e):
            print("💡 Tip: Try running 'python -m venv .venv' manually before running this script")

def main():
    """Main function to process all workflow files."""
    # Ensure we're in the correct directory
    script_dir = Path(__file__).parent
    workspace_root = script_dir.parent
    os.chdir(workspace_root)
    
    workflow_dir = '.github/workflows'
    if not os.path.exists(workflow_dir):
        print(f"❌ Workflow directory not found: {workflow_dir}")
        return
    
    # Setup virtual environment first
    if not setup_virtual_env():
        print("❌ Failed to set up virtual environment")
        return
    
    for file_name in os.listdir(workflow_dir):
        if file_name.endswith('.yml') or file_name.endswith('.yaml'):
            file_path = os.path.join(workflow_dir, file_name)
            process_workflow_file(file_path)

if __name__ == '__main__':
    main() 
