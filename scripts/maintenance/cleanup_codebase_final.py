import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)

def cleanup_final():
    # Create final directory structure
    create_directory('docs/business')
    create_directory('docs/technical')
    create_directory('src/core/auth')
    create_directory('src/core/game')
    create_directory('src/core/utils')
    
    # Move business documents to docs/business
    business_docs = [
        'White Paper Dojo Pool.docx',
        'dojo pool sponsorship partnership.docx',
        'Dojo Pool_ Business Plan.docx',
        'Dojo Pool_ Business Plan (Hybrid Currency Model).docx',
        'Dojo Pool_ Venue Partnership Program.docx',
        'DOJO POOL, investment and ownership structure.docx',
        'BG changes - Copy of Dojo Pool_ Business Plan - July 6, 3_37 AM.docx'
    ]
    
    for doc in business_docs:
        if os.path.exists(f'src/{doc}'):
            shutil.move(f'src/{doc}', f'docs/business/{doc}')
    
    # Move technical documents to docs/technical
    technical_docs = [
        'Reference Tool For Dojo Pool.txt',
        'outsourcing software development.txt',
        'Dojo Pool_ Enhanced Context-Driven Gameplay System.docx',
        'Dojo Pool_ Context-Driven Gameplay Experience.docx'
    ]
    
    for doc in technical_docs:
        if os.path.exists(f'src/{doc}'):
            shutil.move(f'src/{doc}', f'docs/technical/{doc}')
    
    # Clean up Git-related files
    git_files = [
        'git rev-parse --show-toplevel',
        'git rev-parse --show-toplevel.pub',
        'setup_git.py',
        'setup_git_auth.py',
        'configure_repository.py',
        'cleanup_and_configure_git.py'
    ]
    
    for file in git_files:
        if os.path.exists(f'src/{file}'):
            shutil.move(f'src/{file}', f'scripts/git/{file}')
    
    # Move utility scripts
    util_scripts = [
        'combine_workspaces.py',
        'listworkspaces.py'
    ]
    
    for script in util_scripts:
        if os.path.exists(f'src/{script}'):
            shutil.move(f'src/{script}', f'scripts/{script}')
    
    # Clean up duplicate directories
    duplicate_dirs = [
        'src/Dojo_Pool',
        'src/DojoPoolEnhancer',
        'src/TheRolePlayAssistant',
        'src/Dojo Pool Promotional Images',
        'src/Dojo Pool Logos'
    ]
    
    for dir_path in duplicate_dirs:
        if os.path.exists(dir_path):
            try:
                # Move any unique content to appropriate directories
                if os.path.exists(dir_path):
                    for item in os.listdir(dir_path):
                        src_path = os.path.join(dir_path, item)
                        if os.path.isfile(src_path):
                            if item.endswith(('.png', '.jpg', '.jpeg', '.gif')):
                                shutil.move(src_path, f'assets/images/{item}')
                            elif item.endswith(('.py')):
                                shutil.move(src_path, f'src/core/{item}')
                            elif item.endswith(('.html', '.css', '.js')):
                                shutil.move(src_path, f'src/frontend/{item}')
                shutil.rmtree(dir_path)
            except Exception as e:
                print(f"Error processing {dir_path}: {e}")
    
    # Clean up archive files
    if os.path.exists('src/Dojo_Pool.rar'):
        os.remove('src/Dojo_Pool.rar')
    
    # Move remaining empty directories to appropriate locations
    dir_mappings = {
        'src/spectator': 'src/core/spectator',
        'src/ranking': 'src/core/ranking',
        'src/narrative': 'src/core/narrative',
        'src/backend': 'src/core/backend',
        'src/demo': 'src/core/demo'
    }
    
    for old_path, new_path in dir_mappings.items():
        if os.path.exists(old_path):
            create_directory(new_path)
            try:
                # Move contents if any exist
                if os.path.exists(old_path) and os.listdir(old_path):
                    for item in os.listdir(old_path):
                        shutil.move(os.path.join(old_path, item), os.path.join(new_path, item))
                os.rmdir(old_path)
            except Exception as e:
                print(f"Error moving {old_path}: {e}")
    
    # Clean up empty directories
    empty_dirs = [
        'src/ctags',
        'utils',
        'spectator',
        'ranking',
        'narrative',
        'blueprints',
        'api'
    ]
    
    for dir_name in empty_dirs:
        dir_path = f'src/{dir_name}'
        if os.path.exists(dir_path) and not os.listdir(dir_path):
            os.rmdir(dir_path)

if __name__ == '__main__':
    cleanup_final()
    print("Final cleanup completed successfully!") 