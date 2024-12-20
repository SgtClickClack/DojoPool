import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)

def cleanup_codebase():
    # Create necessary directories
    create_directory('scripts/git')
    create_directory('docs')
    create_directory('src/core')
    create_directory('src/api')
    create_directory('src/frontend')
    create_directory('src/config')
    
    # Move Git-related scripts to scripts/git
    git_files = [f for f in os.listdir('.') if f.startswith('git_') or 
                 f.startswith('verify_git') or 
                 'git' in f.lower()]
    
    for file in git_files:
        if os.path.isfile(file):
            shutil.move(file, f'scripts/git/{file}')
    
    # Move documentation files to docs
    doc_extensions = ('.txt', '.docx', '.md')
    doc_files = [f for f in os.listdir('.') if f.endswith(doc_extensions) and f != 'README.md']
    
    for file in doc_files:
        if os.path.isfile(file):
            shutil.move(file, f'docs/{file}')
    
    # Clean up source directory
    src_files = {
        'routes.py': 'src/core/',
        'models.py': 'src/core/',
        'extensions.py': 'src/core/',
        'app.py': 'src/',
    }
    
    for file, dest in src_files.items():
        if os.path.isfile(f'src/{file}'):
            shutil.move(f'src/{file}', f'{dest}{file}')
    
    # Remove temporary and generated files
    temp_patterns = ['*.pyc', '__pycache__', '*.PNF.txt', 'Pasted-*.txt']
    
    for pattern in temp_patterns:
        for file in Path('.').rglob(pattern):
            if file.is_file():
                os.remove(file)
            elif file.is_dir():
                shutil.rmtree(file)

if __name__ == '__main__':
    cleanup_codebase()
    print("Codebase cleanup completed successfully!") 