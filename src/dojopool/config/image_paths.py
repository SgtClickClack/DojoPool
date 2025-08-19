from pathlib import Path
from typing import Any, Dict


def get_image_variants(base_path: str, filename: str) -> Dict[str, Any]:
    """Generate paths for different variants of an image."""
    name = Path(filename).stem
    ext = Path(filename).suffix

    variants = {
        "sm": {
            "original": f"{base_path}/{name}_400w{ext}",
            "webp": f"{base_path}/{name}_400w.webp",
            "avif": f"{base_path}/{name}_400w.avif",
            "width": 400,
        },
        "md": {
            "original": f"{base_path}/{name}_800w{ext}",
            "webp": f"{base_path}/{name}_800w.webp",
            "avif": f"{base_path}/{name}_800w.avif",
            "width": 800,
        },
        "lg": {
            "original": f"{base_path}/{name}_1200w{ext}",
            "webp": f"{base_path}/{name}_1200w.webp",
            "avif": f"{base_path}/{name}_1200w.avif",
            "width": 1200,
        },
        "xl": {
            "original": f"{base_path}/{name}_1600w{ext}",
            "webp": f"{base_path}/{name}_1600w.webp",
            "avif": f"{base_path}/{name}_1600w.avif",
            "width": 1600,
        },
        "default": {
            "original": f"{base_path}/{filename}",
            "webp": f"{base_path}/{name}.webp",
            "avif": f"{base_path}/{name}.avif",
        },
    }

    return variants


# Image paths configuration
IMAGE_PATHS = {
    "core": {
        "logo": get_image_variants("images/core", "LogoDojoPool.jpg"),
        "poster": get_image_variants("images/core", "PosterDojoPool.jpg"),
    },
    "features": {
        "tracking": get_image_variants("images/features", "tracking.jpg"),
        "rankings": get_image_variants("images/features", "rankings.jpg"),
        "venues": get_image_variants("images/features", "venues.jpg"),
        "community": get_image_variants("images/features", "community.jpg"),
    },
    "backgrounds": {
        "hero": get_image_variants("images/backgrounds", "hero-bg.jpg"),
        "vs": get_image_variants("images/backgrounds", "hero-vs.jpg"),
    },
    "icons": {
        "favicon": {
            "ico": "images/icons/favicon.ico",
            "png16": "images/icons/favicon-16x16.png",
            "png32": "images/icons/favicon-32x32.png",
            "webp16": "images/icons/favicon-16x16.webp",
            "webp32": "images/icons/favicon-32x32.webp",
            "avif16": "images/icons/favicon-16x16.avif",
            "avif32": "images/icons/favicon-32x32.avif",
        },
        "apple": {
            "default": "images/icons/apple-touch-icon.png",
            "webp": "images/icons/apple-touch-icon.webp",
            "avif": "images/icons/apple-touch-icon.avif",
        },
        "pwa": {
            "72": {
                "original": "images/icons/icon-72x72.png",
                "webp": "images/icons/icon-72x72.webp",
                "avif": "images/icons/icon-72x72.avif",
            },
            "96": {
                "original": "images/icons/icon-96x96.png",
                "webp": "images/icons/icon-96x96.webp",
                "avif": "images/icons/icon-96x96.avif",
            },
            "128": {
                "original": "images/icons/icon-128x128.png",
                "webp": "images/icons/icon-128x128.webp",
                "avif": "images/icons/icon-128x128.avif",
            },
            "144": {
                "original": "images/icons/icon-144x144.png",
                "webp": "images/icons/icon-144x144.webp",
                "avif": "images/icons/icon-144x144.avif",
            },
            "152": {
                "original": "images/icons/icon-152x152.png",
                "webp": "images/icons/icon-152x152.webp",
                "avif": "images/icons/icon-152x152.avif",
            },
            "192": {
                "original": "images/icons/icon-192x192.png",
                "webp": "images/icons/icon-192x192.webp",
                "avif": "images/icons/icon-192x192.avif",
            },
            "384": {
                "original": "images/icons/icon-384x384.png",
                "webp": "images/icons/icon-384x384.webp",
                "avif": "images/icons/icon-384x384.avif",
            },
            "512": {
                "original": "images/icons/icon-512x512.png",
                "webp": "images/icons/icon-512x512.webp",
                "avif": "images/icons/icon-512x512.avif",
            },
        },
    },
}
