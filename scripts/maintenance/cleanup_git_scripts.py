import os
import shutil
from pathlib import Path

def cleanup_git_scripts():
    """Consolidate redundant Git-related scripts."""
    
    # Core Git scripts to keep
    core_scripts = {
        'git_setup.py': ['git_setup_final.py', 'git_setup_consolidated.py', 'final_git_setup.py'],
        'git_config.py': ['git_config_final.py', 'final_git_config.py', 'git_config_consolidated.py'],
        'git_manager.py': ['git_manager_consolidated.py'],
        'git_cleanup.py': ['cleanup_git_redundant.py', 'cleanup_git_scripts.py', 'cleanup_git_files.py'],
        'git_auth.py': ['configure_git_auth_final.py']
    }
    
    # Create archive directory for old scripts
    archive_dir = Path('../scripts/git/archive')
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    # Process each core script
    for core_script, redundant_scripts in core_scripts.items():
        # Find the most recent version of redundant scripts
        latest_script = None
        latest_time = 0
        
        for script in redundant_scripts:
            script_path = Path(f'../scripts/{script}')
            if script_path.exists():
                mod_time = os.path.getmtime(script_path)
                if mod_time > latest_time:
                    latest_time = mod_time
                    latest_script = script
        
        # If we found a latest version, rename it to core name and archive others
        if latest_script:
            latest_path = Path(f'../scripts/{latest_script}')
            core_path = Path(f'../scripts/git/{core_script}')
            
            # Move latest version to core name
            shutil.move(latest_path, core_path)
            
            # Archive other redundant scripts
            for script in redundant_scripts:
                if script != latest_script:
                    script_path = Path(f'../scripts/{script}')
                    if script_path.exists():
                        shutil.move(script_path, archive_dir / script)
    
    # Clean up PowerShell scripts
    ps_scripts = ['CleanUpProject.ps1']
    for script in ps_scripts:
        script_path = Path(f'../scripts/{script}')
        if script_path.exists():
            shutil.move(script_path, archive_dir / script)
    
    # Clean up test scripts
    test_scripts = ['test_git_setup.py']
    for script in test_scripts:
        script_path = Path(f'../scripts/{script}')
        if script_path.exists():
            shutil.move(script_path, Path('../tests/scripts/') / script)
    
    print("Git scripts cleanup completed successfully!")

if __name__ == '__main__':
    cleanup_git_scripts() 