"""Pack a generated 16-cel character. Requires Pillow, numpy, scipy.
Usage: python scripts/prepare-atlas.py source.png assets/sprites/id.png
"""
from PIL import Image
from atlas_tools import extract_grid, pack_cel
import sys

frames = extract_grid(sys.argv[1])
scale = 96 / frames[0].height
atlas = Image.new('RGBA', (640, 512))
for frame, cel in enumerate(frames):
    atlas.paste(pack_cel(cel, scale), (frame % 4 * 160, frame // 4 * 128))
atlas.save(sys.argv[2], optimize=True)
print(sys.argv[2], atlas.size)
