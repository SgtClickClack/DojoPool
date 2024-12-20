import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)

def cleanup_final_pass():
    # Move IDE config directories to root
    ide_dirs = {
        'src/.vscode': '.vscode',
        'src/ctags': 'ctags'
    }
    
    for src, dest in ide_dirs.items():
        if os.path.exists(src):
            if os.path.exists(dest):
                # Merge contents if destination already exists
                for item in os.listdir(src):
                    src_path = os.path.join(src, item)
                    dest_path = os.path.join(dest, item)
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                    shutil.move(src_path, dest_path)
                shutil.rmtree(src)
            else:
                shutil.move(src, dest)
    
    # Move remaining business plan to docs/business
    business_plan = 'src/BG changes - Copy of Dojo Pool_ Business Plan - July 6, 3_37 AM.docx'
    if os.path.exists(business_plan):
        create_directory('docs/business')
        shutil.move(business_plan, f'docs/business/{os.path.basename(business_plan)}')
    
    # Clean up empty root directories
    root_dirs = [
        'utils',
        'spectator',
        'ranking',
        'narrative',
        'blueprints',
        'api',
        'config'
    ]
    
    for dir_name in root_dirs:
        if os.path.exists(dir_name) and not os.listdir(dir_name):
            os.rmdir(dir_name)
    
    # Move cleanup scripts to scripts/maintenance
    create_directory('scripts/maintenance')
    cleanup_scripts = [
        'cleanup_codebase.py',
        'cleanup_codebase_phase2.py',
        'cleanup_codebase_final.py',
        'cleanup_codebase_final_pass.py'
    ]
    
    for script in cleanup_scripts:
        if os.path.exists(script):
            shutil.move(script, f'scripts/maintenance/{script}')
    
    # Clean up any remaining empty directories in src
    for root, dirs, files in os.walk('src', topdown=False):
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            try:
                if os.path.exists(dir_path) and not os.listdir(dir_path):
                    os.rmdir(dir_path)
            except Exception as e:
                print(f"Could not remove directory {dir_path}: {e}")

if __name__ == '__main__':
    cleanup_final_pass()
    print("Final pass cleanup completed successfully!") 