"""Sprite extraction / packing only: no repainting or pose synthesis."""
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np


def extract_grid(path, columns=4, rows=4):
    source = Image.open(path).convert('RGBA')
    rgba = np.array(source)
    labels, count = label(rgba[:, :, 3] > 24)
    areas = np.bincount(labels.ravel())
    components = sorted(range(1, count + 1), key=lambda i: areas[i], reverse=True)[:columns * rows]
    objects = find_objects(labels)
    frames = [None] * (columns * rows)
    for component in components:
        ys, xs = objects[component - 1]
        col = min(columns - 1, int((xs.start + xs.stop) / 2 / source.width * columns))
        row = min(rows - 1, int((ys.start + ys.stop) / 2 / source.height * rows))
        frame = row * columns + col
        if frames[frame] is not None:
            raise ValueError('Ambiguous sprite slot: ' + str(frame))
        cel = rgba[ys, xs].copy()
        cel[labels[ys, xs] != component] = (0, 0, 0, 0)
        frames[frame] = Image.fromarray(cel)
    if any(cel is None for cel in frames):
        raise ValueError('A sprite slot is missing')
    return frames


def pack_cel(cel, scale):
    cel = cel.resize((round(cel.width * scale), round(cel.height * scale)), Image.Resampling.NEAREST)
    if cel.width > 148 or cel.height > 110:
        raise ValueError('Pose needs a larger cell')
    cell = Image.new('RGBA', (160, 128))
    cell.alpha_composite(cel, ((160 - cel.width) // 2, 112 - cel.height))
    return cell
