from multiprocessing import Pool
from multiprocessing import Pool
import os
import shutil
from pathlib import Path


def organize_images():
    # Setup paths
    base_path = Path("src/dojopool/static/images")
    core_path = base_path / "core"
    backgrounds_path = base_path / "backgrounds"
    features_path = base_path / "features"
    icons_path = base_path / "icons"

    # Ensure directories exist
    for path in [core_path, backgrounds_path, features_path, icons_path]:
        os.makedirs(str(path), exist_ok=True)

    # Core brand images (keep original case)
    logo_source = (
        base_path
        / "A logo for _Dojo Pool_ featuring a pool cue or pool ball, a stylized dojo, an anime-style cha.png"
    )
    poster_source = base_path / "PosterDojoPool.jpg"

    if logo_source.exists():
        try:
            shutil.copy2(logo_source, core_path / "LogoDojoPool.jpg")
            print(f"Copied {logo_source.name} to core/LogoDojoPool.jpg")
        except Exception as e:
            print(f"Error copying logo: {e}")

    if poster_source.exists():
        try:
            shutil.copy2(poster_source, core_path / "PosterDojoPool.jpg")
            print(f"Copied {poster_source.name} to core/PosterDojoPool.jpg")
        except Exception as e:
            print(f"Error copying poster: {e}")

    # Move and rename background images to lowercase
    background_patterns = ["hero-vs.jpg", "*.webp"]
    for pattern in background_patterns:
        for file in base_path.glob(pattern):
            if file.is_file():
                try:
                    new_name = file.name.lower()
                    target = backgrounds_path / new_name
                    if target.exists():
                        os.remove(str(target))
                    shutil.copy2(file, target)
                    print(f"Moved {file.name} to backgrounds/ as {new_name}")
                except Exception as e:
                    print(f"Error moving {file.name}: {e}")

    # Move and rename icons to lowercase
    icon_patterns = ["*icon*", "generated-icon.png"]
    for pattern in icon_patterns:
        for file in base_path.glob(pattern):
            if file.is_file():
                try:
                    new_name = file.name.lower()
                    target = icons_path / new_name
                    if target.exists():
                        os.remove(str(target))
                    shutil.copy2(file, target)
                    print(f"Moved {file.name} to icons/ as {new_name}")
                except Exception as e:
                    print(f"Error moving {file.name}: {e}")

    # Move and rename remaining images to lowercase
    for file in base_path.glob("*.jpg"):
        if file.name not in ["LogoDojoPool.jpg", "PosterDojoPool.jpg", "hero-vs.jpg"]:
            try:
                new_name = file.name.lower()
                if not any(new_name.startswith(prefix) for prefix in ["_", "file-"]):
                    target = features_path / new_name
                    if target.exists():
                        os.remove(str(target))
                    shutil.copy2(file, target)
                    print(f"Moved {file.name} to features/ as {new_name}")
            except Exception as e:
                print(f"Error moving {file.name}: {e}")

    # Clean up original files that have been moved
    for file in base_path.glob("*.*"):
        if file.is_file() and file.suffix.lower() in [".jpg", ".png", ".webp", ".svg"]:
            if file.name not in ["LogoDojoPool.jpg", "PosterDojoPool.jpg"]:
                try:
                    os.remove(str(file))
                    print(f"Removed original file: {file.name}")
                except Exception as e:
                    print(f"Error removing {file.name}: {e}")


if __name__ == "__main__":
    organize_images()
