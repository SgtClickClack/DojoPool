import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    Path(path).mkdir(parents=True, exist_ok=True)

def cleanup_phase2():
    # Create additional directories
    create_directory('src/static')
    create_directory('src/templates')
    create_directory('src/assets')
    create_directory('assets/images')
    
    # Consolidate Dojo Pool related directories
    dojo_pool_dirs = [
        'Dojo_Pool',
        'Dojo_Pool_fresh',
        'DojoPoolEnhancer',
        'DojoPoolEnhancer (2)',
        'Dojo Pool',
    ]
    
    # Move contents to src directory and remove empty directories
    for dir_name in dojo_pool_dirs:
        if os.path.exists(dir_name):
            try:
                for item in os.listdir(dir_name):
                    src_path = os.path.join(dir_name, item)
                    if os.path.isfile(src_path):
                        shutil.move(src_path, f'src/{item}')
                    elif os.path.isdir(src_path):
                        shutil.move(src_path, f'src/{item}')
                shutil.rmtree(dir_name)
            except Exception as e:
                print(f"Error processing {dir_name}: {e}")
    
    # Move image assets
    image_files = ['image.png', 'generated-icon.png']
    for img in image_files:
        if os.path.exists(img):
            shutil.move(img, f'assets/images/{img}')
    
    # Move promotional images and logos
    promo_dirs = ['Dojo Pool Promotional Images', 'Dojo Pool Logos']
    for dir_name in promo_dirs:
        if os.path.exists(dir_name):
            try:
                for item in os.listdir(dir_name):
                    src_path = os.path.join(dir_name, item)
                    if os.path.isfile(src_path):
                        shutil.move(src_path, f'assets/images/{item}')
                shutil.rmtree(dir_name)
            except Exception as e:
                print(f"Error processing {dir_name}: {e}")
    
    # Move core application files to appropriate locations
    file_moves = {
        'routes.py': 'src/core/',
        'models.py': 'src/core/',
        'extensions.py': 'src/core/',
        'app.py': 'src/',
        'main.py': 'src/',
        'combine_workspaces.py': 'scripts/',
        'configure_repository.py': 'scripts/git/',
        'listworkspaces.py': 'scripts/',
    }
    
    for file, dest in file_moves.items():
        if os.path.exists(file):
            create_directory(os.path.dirname(dest))
            shutil.move(file, f'{dest}{file}')
    
    # Move static and template files
    if os.path.exists('static'):
        for item in os.listdir('static'):
            shutil.move(f'static/{item}', f'src/static/{item}')
        os.rmdir('static')
    
    if os.path.exists('templates'):
        for item in os.listdir('templates'):
            shutil.move(f'templates/{item}', f'src/templates/{item}')
        os.rmdir('templates')
    
    # Clean up empty directories
    dirs_to_check = ['utils', 'spectator', 'ranking', 'narrative', 'blueprints', 'api']
    for dir_name in dirs_to_check:
        if os.path.exists(dir_name) and not os.listdir(dir_name):
            os.rmdir(dir_name)

if __name__ == '__main__':
    cleanup_phase2()
    print("Phase 2 cleanup completed successfully!") 