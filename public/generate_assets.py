"""Generate PWA assets."""

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont


def create_gradient(size, color1, color2):
    """Create a vertical gradient."""
    base = Image.new("RGB", (size, size), color1)
    top = Image.new("RGB", (size, size), color2)
    mask = Image.new("L", (size, size))
    mask_data = []
    for y in range(size):
        mask_data.extend([int(255 * (y / size))] * size)
    mask.putdata(mask_data)
    return Image.composite(base, top, mask)


def create_logo(size, output_path):
    """Create a simple logo at the specified size."""
    # Create a gradient background
    img = create_gradient(size, "#2c3e50", "#1a1a1a")
    draw = ImageDraw.Draw(img)

    # Draw outer circle with glow effect
    margin = size // 20
    for i in range(3):
        offset = i * 2
        draw.ellipse(
            [
                margin - offset,
                margin - offset,
                size - margin + offset,
                size - margin + offset,
            ],
            outline="#4a90e2",
            width=size // 32,
        )

    # Draw pool table with felt texture
    table_margin = size // 4
    table_rect = [
        table_margin,
        table_margin + size // 8,
        size - table_margin,
        size - table_margin - size // 8,
    ]
    draw.rectangle(table_rect, fill="#006400", outline="#8b4513", width=size // 64)

    # Add table cushions
    cushion_width = size // 32
    draw.rectangle(
        [table_rect[0], table_rect[1], table_rect[2], table_rect[1] + cushion_width],
        fill="#8b4513",
    )  # Top cushion
    draw.rectangle(
        [table_rect[0], table_rect[3] - cushion_width, table_rect[2], table_rect[3]],
        fill="#8b4513",
    )  # Bottom cushion
    draw.rectangle(
        [table_rect[0], table_rect[1], table_rect[0] + cushion_width, table_rect[3]],
        fill="#8b4513",
    )  # Left cushion
    draw.rectangle(
        [table_rect[2] - cushion_width, table_rect[1], table_rect[2], table_rect[3]],
        fill="#8b4513",
    )  # Right cushion

    # Draw pool balls with shadows
    ball_radius = size // 25
    shadow_offset = size // 100

    # White ball shadow
    draw.ellipse(
        [
            size // 2 - ball_radius * 3 + shadow_offset,
            size // 2 - ball_radius + shadow_offset,
            size // 2 - ball_radius + shadow_offset,
            size // 2 + ball_radius + shadow_offset,
        ],
        fill="#000000",
        outline="#000000",
    )
    # White ball
    draw.ellipse(
        [
            size // 2 - ball_radius * 3,
            size // 2 - ball_radius,
            size // 2 - ball_radius,
            size // 2 + ball_radius,
        ],
        fill="#ffffff",
        outline="#000000",
    )
    # Add highlight to white ball
    highlight_radius = ball_radius // 3
    draw.ellipse(
        [
            size // 2 - ball_radius * 3 + highlight_radius,
            size // 2 - ball_radius + highlight_radius,
            size // 2 - ball_radius * 2.5 + highlight_radius,
            size // 2 - ball_radius // 2 + highlight_radius,
        ],
        fill="#ffffff",
    )

    # Yellow ball shadow
    draw.ellipse(
        [
            size // 2 + ball_radius + shadow_offset,
            size // 2 - ball_radius + shadow_offset,
            size // 2 + ball_radius * 3 + shadow_offset,
            size // 2 + ball_radius + shadow_offset,
        ],
        fill="#000000",
        outline="#000000",
    )
    # Yellow ball
    draw.ellipse(
        [
            size // 2 + ball_radius,
            size // 2 - ball_radius,
            size // 2 + ball_radius * 3,
            size // 2 + ball_radius,
        ],
        fill="#ffd700",
        outline="#000000",
    )
    # Add highlight to yellow ball
    draw.ellipse(
        [
            size // 2 + ball_radius * 1.5,
            size // 2 - ball_radius + highlight_radius,
            size // 2 + ball_radius * 2,
            size // 2 - ball_radius // 2 + highlight_radius,
        ],
        fill="#fff7cc",
    )

    # Draw cue stick with perspective
    stick_width = size // 64
    draw.line(
        [size // 4, size - size // 4, size - size // 4, size // 4],
        fill="#8b4513",
        width=stick_width,
    )
    # Add cue tip
    draw.ellipse(
        [
            size - size // 4 - stick_width,
            size // 4 - stick_width,
            size - size // 4 + stick_width,
            size // 4 + stick_width,
        ],
        fill="#2f1810",
    )

    # Add text with shadow effect
    try:
        font_size = size // 8
        font = ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()

    text = "DOJO"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (size - text_width) // 2
    y = size - size // 3

    # Draw text shadow
    shadow_offset = size // 50
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill="#000000")
    draw.text((x, y), text, font=font, fill="#4a90e2")

    # Apply subtle blur for anti-aliasing
    img = img.filter(ImageFilter.SMOOTH)

    # Save the image
    img.save(output_path, quality=95)


def generate_ico(png_path, output_path):
    """Generate ICO file from PNG."""
    img = Image.open(png_path)
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    img.save(output_path, format="ICO", sizes=icon_sizes)


def main():
    """Generate all required assets."""
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Generate PNG files
    create_logo(192, os.path.join(current_dir, "logo192.png"))
    create_logo(512, os.path.join(current_dir, "logo512.png"))

    # Generate favicon
    generate_ico(
        os.path.join(current_dir, "logo512.png"),
        os.path.join(current_dir, "favicon.ico"),
    )

    print("Generated all PWA assets successfully!")


if __name__ == "__main__":
    main()
