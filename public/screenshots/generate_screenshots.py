"""Generate placeholder screenshots for PWA."""

import os
from datetime import datetime

from PIL import Image, ImageDraw, ImageFilter, ImageFont


def create_gradient(size, color1, color2):
    """Create a vertical gradient."""
    base = Image.new("RGB", size, color1)
    top = Image.new("RGB", size, color2)
    mask = Image.new("L", size)
    mask_data = []
    for y in range(size[1]):
        mask_data.extend([int(255 * (y / size[1]))] * size[0])
    mask.putdata(mask_data)
    return Image.composite(base, top, mask)


def draw_modern_card(draw, x, y, width, height, color="#ffffff", alpha=128):
    """Draw a modern card with rounded corners."""
    radius = 10
    fill = (*[int(color[i : i + 2], 16) for i in (1, 3, 5)], alpha)

    # Draw main rectangle
    draw.rectangle([x + radius, y, x + width - radius, y + height], fill=fill)
    draw.rectangle([x, y + radius, x + width, y + height - radius], fill=fill)

    # Draw corners
    draw.pieslice([x, y, x + radius * 2, y + radius * 2], 180, 270, fill=fill)
    draw.pieslice([x + width - radius * 2, y, x + width, y + radius * 2], 270, 360, fill=fill)
    draw.pieslice([x, y + height - radius * 2, x + radius * 2, y + height], 90, 180, fill=fill)
    draw.pieslice(
        [x + width - radius * 2, y + height - radius * 2, x + width, y + height], 0, 90, fill=fill
    )


def create_screenshot(filename, text, size=(1280, 720)):
    """Create a modern screenshot with UI elements."""
    # Create base image with gradient
    img = create_gradient(size, "#1a1a1a", "#2c3e50")

    # Create a new RGBA layer for UI elements
    ui_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ui_layer)

    try:
        title_font = ImageFont.truetype("arial.ttf", 36)
        text_font = ImageFont.truetype("arial.ttf", 24)
    except OSError:
        title_font = text_font = ImageFont.load_default()

    # Draw header
    draw_modern_card(draw, 0, 0, size[0], 80, "#ffffff", 20)
    draw.text((40, 20), "DojoPool", font=title_font, fill="#ffffff")

    # Draw navigation menu
    menu_items = ["Home", "Games", "Tournaments", "Profile", "Settings"]
    for i, item in enumerate(menu_items):
        x = 200 + i * 150
        draw.text((x, 25), item, font=text_font, fill="#4a90e2" if item in text else "#ffffff")

    # Draw main content area
    if "Home" in text:
        # Home screen layout
        draw_modern_card(draw, 40, 100, size[0] - 80, 200, "#ffffff", 30)
        draw.text((60, 120), "Welcome to DojoPool", font=title_font, fill="#ffffff")
        draw.text((60, 170), "Your Ultimate Pool Gaming Experience", font=text_font, fill="#4a90e2")

        # Stats cards
        stats = [("Active Players", "1,234"), ("Tournaments", "42"), ("Games Today", "567")]
        for i, (label, value) in enumerate(stats):
            x = 40 + i * (size[0] - 120) / 3
            draw_modern_card(draw, x, 320, (size[0] - 120) / 3 - 20, 150, "#ffffff", 40)
            draw.text((x + 20, 340), label, font=text_font, fill="#ffffff")
            draw.text((x + 20, 380), value, font=title_font, fill="#4a90e2")

    elif "Game" in text:
        # Game interface layout
        draw_modern_card(draw, 40, 100, size[0] - 400, size[1] - 140, "#ffffff", 30)  # Game area
        draw_modern_card(draw, size[0] - 340, 100, 300, size[1] - 140, "#ffffff", 40)  # Sidebar

        # Game controls
        draw.text((size[0] - 320, 120), "Game Controls", font=text_font, fill="#ffffff")
        controls = ["Aim", "Power", "Spin", "View"]
        for i, control in enumerate(controls):
            y = 170 + i * 50
            draw_modern_card(draw, size[0] - 320, y, 260, 40, "#4a90e2", 60)
            draw.text((size[0] - 300, y + 8), control, font=text_font, fill="#ffffff")

    elif "Stats" in text:
        # Statistics dashboard layout
        charts = [
            (40, 100, (size[0] - 100) / 2, 250),
            (size[0] / 2 + 10, 100, size[0] - 40, 250),
            (40, 370, size[0] - 40, size[1] - 410),
        ]

        for x, y, w, h in charts:
            draw_modern_card(draw, x, y, w - x, h - y, "#ffffff", 30)
            draw.text((x + 20, y + 20), "Statistics Chart", font=text_font, fill="#ffffff")

    # Draw footer
    draw_modern_card(draw, 0, size[1] - 60, size[0], 60, "#ffffff", 20)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    draw.text((size[0] - 200, size[1] - 40), now, font=text_font, fill="#ffffff")

    # Composite the UI layer onto the background
    img = Image.alpha_composite(img.convert("RGBA"), ui_layer)

    # Apply subtle blur for anti-aliasing
    img = img.filter(ImageFilter.SMOOTH)

    # Save the image
    img.convert("RGB").save(filename, "PNG", quality=95)


def main():
    """Generate all screenshots."""
    current_dir = os.path.dirname(os.path.abspath(__file__))

    screenshots = [
        ("home.png", "DojoPool Home"),
        ("game.png", "Game Interface"),
        ("stats.png", "Statistics Dashboard"),
    ]

    for filename, text in screenshots:
        output_path = os.path.join(current_dir, filename)
        create_screenshot(output_path, text)
        print(f"Generated {filename}")


if __name__ == "__main__":
    main()
