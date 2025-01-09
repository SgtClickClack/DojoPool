import os
from cairosvg import svg2png

def convert_svg_to_png(svg_path, png_path, size=None):
    try:
        with open(svg_path, 'rb') as svg_file:
            svg_data = svg_file.read()
            if size:
                svg2png(bytestring=svg_data, write_to=png_path, output_width=size, output_height=size)
            else:
                svg2png(bytestring=svg_data, write_to=png_path)
        print(f"Converted {svg_path} to {png_path}")
    except Exception as e:
        print(f"Error converting {svg_path}: {str(e)}")

def main():
    icons_dir = os.path.join('src', 'static', 'images', 'icons')
    
    # Icon sizes needed for PWA
    icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Convert each SVG to PNG in different sizes
    for size in icon_sizes:
        svg_path = os.path.join(icons_dir, f'icon-{size}x{size}.svg')
        png_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        if os.path.exists(svg_path):
            convert_svg_to_png(svg_path, png_path)
    
    # Convert Microsoft Tile icons
    mstile_sizes = [(70, 70), (150, 150), (310, 310), (310, 150)]
    for width, height in mstile_sizes:
        svg_path = os.path.join(icons_dir, f'mstile-{width}x{height}.svg')
        png_path = os.path.join(icons_dir, f'mstile-{width}x{height}.png')
        if os.path.exists(svg_path):
            convert_svg_to_png(svg_path, png_path)
    
    # Convert favicon icons
    favicon_sizes = [16, 32]
    for size in favicon_sizes:
        svg_path = os.path.join(icons_dir, f'favicon-{size}x{size}.svg')
        png_path = os.path.join(icons_dir, f'favicon-{size}x{size}.png')
        if os.path.exists(svg_path):
            convert_svg_to_png(svg_path, png_path, size)
    
    # Convert Apple Touch Icon
    svg_path = os.path.join(icons_dir, 'apple-touch-icon.svg')
    png_path = os.path.join(icons_dir, 'apple-touch-icon.png')
    if os.path.exists(svg_path):
        convert_svg_to_png(svg_path, png_path, 180)

if __name__ == '__main__':
    main()
