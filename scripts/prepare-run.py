"""Replace only cels 2-5 from a four-captain four-phase running sheet."""
from PIL import Image
from atlas_tools import extract_grid, pack_cel
import sys

frames = extract_grid(sys.argv[1])
for row, name in enumerate(['riko', 'gaspard', 'iris', 'vega']):
    scale = 96 / frames[row * 4].height
    path = 'assets/sprites/' + name + '.png'
    atlas = Image.open(path).convert('RGBA')
    for col in range(4):
        cel = col + 2
        atlas.paste(pack_cel(frames[row * 4 + col], scale), (cel % 4 * 160, cel // 4 * 128))
    atlas.save(path, optimize=True)
    print(path)
