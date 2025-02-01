import logging
import re
from pathlib import Path

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Critical paths that should not use lazy loading
CRITICAL_PATHS = {
    "hero": ["hero", "banner", "header"],
    "logo": ["logo", "brand"],
    "above_fold": ["above-fold", "primary"],
}


def is_critical_image(src: str, alt: str) -> bool:
    """Determine if an image is critical based on its path and alt text."""
    lower_src = src.lower()
    lower_alt = alt.lower() if alt else ""

    return any(
        keyword in lower_src or keyword in lower_alt
        for keywords in CRITICAL_PATHS.values()
        for keyword in keywords
    )


def add_lazy_loading(html_file: str) -> None:
    """Add lazy loading and WebP support to images in HTML file."""
    try:
        with open(html_file, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        # Process each img tag
        modified = False
        for img in soup.find_all("img"):
            # Skip if already has loading attribute
            if img.get("loading"):
                continue

            # Get the source path and alt text
            src = img.get("src", "")
            alt = img.get("alt", "")

            # Determine if image is critical
            critical = is_critical_image(src, alt)

            # Add appropriate loading attribute
            img["loading"] = "eager" if critical else "lazy"
            modified = True

            # Check if WebP version exists
            if src.endswith((".jpg", ".jpeg", ".png")):
                webp_src = re.sub(r"\.(jpg|jpeg|png)$", ".webp", src)
                static_path = Path("src/dojopool/static")
                webp_path = static_path / webp_src.lstrip("/")

                if webp_path.exists():
                    # Create picture element
                    picture = soup.new_tag("picture")
                    source = soup.new_tag("source")
                    source["srcset"] = webp_src
                    source["type"] = "image/webp"

                    # Move img attributes to picture
                    for attr in ["class", "style"]:
                        if img.get(attr):
                            picture[attr] = img[attr]
                            del img[attr]

                    # Wrap img with picture and source
                    img.wrap(picture)
                    picture.insert(0, source)

        # Save changes if modifications were made
        if modified:
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(str(soup))
            logger.info(f"Updated lazy loading in {html_file}")

    except Exception as e:
        logger.error(f"Error processing {html_file}: {str(e)}")


def process_templates(template_dir: str = "src/dojopool/templates") -> None:
    """Process all HTML templates in the specified directory."""
    template_path = Path(template_dir)

    # Find all HTML files
    html_files = list(template_path.rglob("*.html"))

    # Process each file
    for html_file in html_files:
        logger.info(f"Processing {html_file}")
        add_lazy_loading(str(html_file))


if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    # Process all templates
    process_templates()
