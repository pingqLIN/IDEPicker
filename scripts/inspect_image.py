from PIL import Image
import os

img_path = r"C:/Users/addra/.gemini/antigravity/brain/41141ab5-8219-4788-96d2-d4d8a550599f/uploaded_media_1769945417848.png"

try:
    img = Image.open(img_path)
    print(f"Format: {img.format}")
    print(f"Size: {img.size}")
    print(f"Mode: {img.mode}")
    
    if img.mode == 'RGBA':
        bbox = img.getbbox()
        print(f"Content Bounding Box: {bbox}")
        
        # Check corner pixels for transparency
        corners = [(0,0), (img.width-1, 0), (0, img.height-1), (img.width-1, img.height-1)]
        print("Corner pixels:")
        for c in corners:
            print(f"{c}: {img.getpixel(c)}")
            
except Exception as e:
    print(f"Error: {e}")
