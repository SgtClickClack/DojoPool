import os
import shutil
from pathlib import Path

def setup_core_images():
    try:
        # Get the absolute path to the workspace
        workspace = Path(os.getcwd())
        images_dir = workspace / 'src' / 'dojopool' / 'static' / 'images'
        core_dir = images_dir / 'core'

        # Create core directory if it doesn't exist as a file
        if os.path.isfile(str(core_dir)):
            os.remove(str(core_dir))
        if not os.path.exists(str(core_dir)):
            os.makedirs(str(core_dir))

        # Find and copy logo
        logo_file = images_dir / 'A logo for _Dojo Pool_ featuring a pool cue or pool ball, a stylized dojo, an anime-style cha.png'
        if logo_file.exists():
            print(f"Found logo file: {logo_file}")
            target = core_dir / 'LogoDojoPool.jpg'
            print(f"Copying to: {target}")
            shutil.copy2(str(logo_file), str(target))

        # Find and copy poster
        poster = images_dir / 'PosterDojoPool.jpg'
        if poster.exists():
            print(f"Found poster file: {poster}")
            target = core_dir / 'PosterDojoPool.jpg'
            print(f"Copying to: {target}")
            shutil.copy2(str(poster), str(target))

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    setup_core_images() 