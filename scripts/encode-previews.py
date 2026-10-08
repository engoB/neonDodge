"""Encode renderer review frames; requires Pillow. Run after the preview scripts."""
from PIL import Image
from pathlib import Path

def encode(folder, target, duration, limit=None, size=None):
    paths = sorted(Path(folder).glob('*.png'))
    if limit: paths = paths[:limit]
    frames = [Image.open(p).convert('RGB') for p in paths]
    if size: frames = [im.resize(size, Image.Resampling.NEAREST) for im in frames]
    montage = Image.new('RGB', (frames[0].width, len(frames)*frames[0].height))
    for i,im in enumerate(frames):montage.paste(im,(0,i*im.height))
    palette = montage.quantize(colors=256)
    frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in frames]
    frames[0].save(target, save_all=True, append_images=frames[1:], duration=duration, loop=0, optimize=True, disposal=1)
    print(target, Path(target).stat().st_size)

encode('.tmp/animation','docs/previews/captains-animation.gif',83)
encode('.tmp/run-review','docs/previews/course-capitaines.gif',42)
encode('.tmp/run-ingame','docs/previews/course-en-match.gif',83,limit=36,size=(633,270))
