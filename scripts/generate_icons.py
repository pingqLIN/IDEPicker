from PIL import Image, ImageDraw
import os
import sys

# Source path from the uploaded file
source_path = r"C:/Users/addra/.gemini/antigravity/brain/41141ab5-8219-4788-96d2-d4d8a550599f/uploaded_media_1769945417848.png"
# Destination directory
dest_dir = r"c:/Dev/project/IDE-Link-Interceptor/extension/icons"

sizes = [16, 48, 128]

def create_circular_icon(source_img, size):
    # Create transparent canvas
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    
    # Draw white circle background
    # Use size-1 to ensure it fits within the canvas without clipping anti-aliasing pixels
    draw.ellipse((0, 0, size-1, size-1), fill=(255, 255, 255, 255))
    
    # Calculate target size for the logo
    # We want to maximize it but keep it inside the circle.
    # Since the logo is wide, width is the constraint.
    # To look good (padding), let's use 85% of the diameter.
    # If the user wants "maximized", 90-95% might be closer, but 85% is safe for aesthetics.
    target_width_ratio = 0.85 
    target_max_width = int(size * target_width_ratio)
    
    # Calculate aspect ratio
    width, height = source_img.size
    aspect = width / height
    
    new_width = target_max_width
    new_height = int(target_max_width / aspect)
        
    # Resize source image (LANCZOS for quality)
    resampled_icon = source_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Center the icon
    pos = ((size - new_width) // 2, (size - new_height) // 2)
    
    # Paste centered (alpha composite to blend with white circle)
    canvas.alpha_composite(resampled_icon, dest=pos)
    return canvas

def generate_icons():
    print(f"Processing {source_path}...")
    try:
        if not os.path.exists(source_path):
            print(f"Error: Source file not found at {source_path}")
            return

        img = Image.open(source_path)
        img = img.convert("RGBA")
        
        # Crop to content (remove transparent borders)
        bbox = img.getbbox()
        if bbox:
            print(f"Cropping to content: {bbox}")
            img = img.crop(bbox)
        else:
            print("Warning: Image seems to be fully transparent.")

        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)

        # Generate sized icons
        for size in sizes:
            final_icon = create_circular_icon(img, size)
            out_path = os.path.join(dest_dir, f"icon{size}.png")
            final_icon.save(out_path, "PNG")
            print(f"Saved {out_path}")
        
        print("All icons generated successfully.")

    except Exception as e:
        print(f"Error generating icons: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_icons()
