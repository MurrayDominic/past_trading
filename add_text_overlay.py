"""Add text overlays with Copperplate Gothic Bold, top-right positioning.
Resize to exact Steam dimensions. Save to artwork/with-text/"""

from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import os

INPUT_DIR = "artwork"
OUTPUT_DIR = "artwork/with-text"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT_PATH = "C:/Windows/Fonts/COPRGTB.TTF"
TITLE_LINE1 = "SECOND CHANCE"
TITLE_LINE2 = "AT A BILLION"
TITLE_SINGLE = "SECOND CHANCE AT A BILLION"


def resize_exact(img, target_w, target_h):
    w, h = img.size
    scale = max(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def add_text_line(draw, text, font_size, position, color=(255, 255, 255)):
    font = ImageFont.truetype(FONT_PATH, font_size)
    shadow_offset = max(2, font_size // 20)
    for dx in range(-shadow_offset, shadow_offset + 1):
        for dy in range(-shadow_offset, shadow_offset + 1):
            draw.text((position[0] + dx, position[1] + dy), text, font=font, fill=(0, 0, 0, 180))
    draw.text(position, text, font=font, fill=color)


def add_title_topright(img, font_size, margin_right=50, margin_top=60):
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, font_size)

    bbox1 = draw.textbbox((0, 0), TITLE_LINE1, font=font)
    bbox2 = draw.textbbox((0, 0), TITLE_LINE2, font=font)
    w1 = bbox1[2] - bbox1[0]
    w2 = bbox2[2] - bbox2[0]
    h1 = bbox1[3] - bbox1[1]
    line_gap = font_size // 3

    x1 = img.width - margin_right - w1
    x2 = img.width - margin_right - w2
    y1 = margin_top
    y2 = margin_top + h1 + line_gap

    add_text_line(draw, TITLE_LINE1, font_size, (x1, y1))
    add_text_line(draw, TITLE_LINE2, font_size, (x2, y2))
    return img


# 1. Main Capsule (1232 x 706)
print("Processing Main Capsule...")
img = Image.open(f"{INPUT_DIR}/Main Capsule (1232 x 706).png")
img = resize_exact(img, 1232, 706)
img = add_title_topright(img, font_size=48)
img.save(f"{OUTPUT_DIR}/Main Capsule (1232 x 706).png")
print(f"  Saved at {img.size}")

# 2. Header Capsule (920 x 430)
print("Processing Header Capsule...")
img = Image.open(f"{INPUT_DIR}/Header Capsule (920 x 430).png")
img = resize_exact(img, 920, 430)
img = add_title_topright(img, font_size=36, margin_right=35, margin_top=40)
img.save(f"{OUTPUT_DIR}/Header Capsule (920 x 430).png")
print(f"  Saved at {img.size}")

# 3. Small Capsule (462 x 174) - centered single line
print("Processing Small Capsule...")
img = Image.open(f"{INPUT_DIR}/Small Capsule (462 x 174).png")
img = resize_exact(img, 462, 174)
draw = ImageDraw.Draw(img)
font_size = 14
font = ImageFont.truetype(FONT_PATH, font_size)
bbox = draw.textbbox((0, 0), TITLE_SINGLE, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]
x = (462 - text_w) // 2
y = (174 - text_h) // 2
add_text_line(draw, TITLE_SINGLE, font_size, (x, y))
img.save(f"{OUTPUT_DIR}/Small Capsule (462 x 174).png")
print(f"  Saved at {img.size}")

# 4. Social Media Banner (1200 x 630) - title only
print("Processing Social Media Banner...")
img = Image.open(f"{INPUT_DIR}/Social Media Banner (1200 x 630).png")
img = resize_exact(img, 1200, 630)
img = add_title_topright(img, font_size=46, margin_right=45, margin_top=50)
img.save(f"{OUTPUT_DIR}/Social Media Banner (1200 x 630).png")
print(f"  Saved at {img.size}")

print("\nDone! All images saved to artwork/with-text/")
