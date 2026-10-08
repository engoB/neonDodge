"""Pack generated character components into engine cells without repainting art.
Requires Pillow, numpy, scipy. Usage: python scripts/prepare-atlas.py source.png target.png
"""
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np
import sys

source = Image.open(sys.argv[1]).convert('RGBA')
rgba = np.array(source)
labels, count = label(rgba[:, :, 3] > 24)
areas = np.bincount(labels.ravel())
components = sorted(range(1, count + 1), key=lambda i: areas[i], reverse=True)[:16]
objects = find_objects(labels)
frames = [None] * 16
for component in components:
    ys, xs = objects[component - 1]
    col = min(3, int((xs.start + xs.stop) / 2 / source.width * 4))
    row = min(3, int((ys.start + ys.stop) / 2 / source.height * 4))
    frame = row * 4 + col
    if frames[frame] is not None:
        raise ValueError('Ambiguous sprite slot: ' + str(frame))
    # The component mask removes neighboring limbs when a generated pose
    # extends across a nominal source grid boundary. Its own silhouette is whole.
    cel = rgba[ys, xs].copy()
    cel[labels[ys, xs] != component] = (0, 0, 0, 0)
    frames[frame] = Image.fromarray(cel)
if any(cel is None for cel in frames):
    raise ValueError('A sprite slot is missing')
scale = 96 / frames[0].height
atlas = Image.new('RGBA', (640, 512))
for frame, cel in enumerate(frames):
    cel = cel.resize((round(cel.width * scale), round(cel.height * scale)), Image.Resampling.NEAREST)
    if cel.width > 148 or cel.height > 108:
        raise ValueError('Pose needs a larger cell: ' + str(frame))
    x, y = frame % 4 * 160 + (160 - cel.width) // 2, frame // 4 * 128 + 112 - cel.height
    atlas.alpha_composite(cel, (x,y))
atlas.save(sys.argv[2], optimize=True)
print(sys.argv[2], atlas.size)
