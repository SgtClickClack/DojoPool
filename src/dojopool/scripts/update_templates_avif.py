import gc
import gc
import logging
from pathlib import Path
from typing import Optional

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)


def add_avif_source(picture: Tag, img: Tag) -> bool:
    """Add AVIF source to picture element if not present."""
    # Skip if AVIF source already exists
    if picture.find("source", attrs={"type": "image/avif"}):
        return False

    # Get WebP source for reference
    webp_source = picture.find("source", attrs={"type": "image/webp"})
    if not webp_source or not isinstance(webp_source, Tag):
        return False

    # Create AVIF source based on WebP source
    avif_source = BeautifulSoup("", "html.parser").new_tag("source")
    avif_source.attrs["type"] = "image/avif"

    # Handle responsive images
    srcset = webp_source.attrs.get("srcset")
    if srcset and isinstance(srcset, str):
        avif_srcset = srcset.replace(".webp", ".avif")
        avif_source.attrs["srcset"] = avif_srcset
        sizes = webp_source.attrs.get("sizes")
        if sizes:
            avif_source.attrs["sizes"] = sizes
    else:
        src = webp_source.attrs.get("src", "")
        if src and isinstance(src, str):
            avif_source.attrs["src"] = src.replace(".webp", ".avif")

    # Insert AVIF source before WebP source
    webp_source.insert_before(avif_source)
    return True


def update_template(template_file: Path):
    """Update a template file to include AVIF sources."""
    try:
        with open(template_file, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        modified = False
        for picture in soup.find_all("picture"):
            if not isinstance(picture, Tag):
                continue

            img = picture.find("img")
            if not img or not isinstance(img, Tag):
                continue

            if add_avif_source(picture, img):
                modified = True

        if modified:
            with open(template_file, "w", encoding="utf-8") as f:
                f.write(str(soup))
            logger.info(f"Updated {template_file} with AVIF support")

    except Exception as e:
        logger.error(f"Error updating {template_file}: {str(e)}")


def process_templates(template_dir: Optional[str] = None) -> None:
    """Process all templates in the specified directory."""
    if template_dir is None:
        template_dir = "src/dojopool/templates"

    template_path = Path(template_dir)

    # Find all HTML files
    html_files = list(template_path.rglob("*.html"))

    # Process each file
    for html_file in html_files:
        logger.info(f"Processing {html_file}")
        update_template(html_file)


if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    # Process templates
    process_templates()
