"""Generate the original baseball PWA icons without third-party image assets."""

from math import sin, cos, pi
from pathlib import Path
from PIL import Image, ImageDraw


def icon(size: int) -> Image.Image:
    scale = size / 512
    canvas = Image.new("RGB", (size, size), "#07111f")
    draw = ImageDraw.Draw(canvas)

    def box(coords):
        return tuple(round(number * scale) for number in coords)

    draw.rounded_rectangle(box((0, 0, 511, 511)), radius=round(105 * scale), fill="#0c2e3d")
    draw.ellipse(box((82, 100, 430, 448)), fill="#04121b")
    draw.ellipse(box((90, 90, 422, 422)), fill="#e7d6a8")
    draw.ellipse(box((97, 97, 415, 415)), fill="#fff0c7")
    draw.ellipse(box((125, 113, 301, 250)), fill="#fff7e1")

    for side in (-1, 1):
        points = []
        for step in range(33):
            t = step / 32
            y = 108 + t * 296
            x = 256 + side * (155 - 62 * sin(pi * t))
            points.append((round(x * scale), round(y * scale)))
        draw.line(points, fill="#d94255", width=max(2, round(5 * scale)), joint="curve")
        for i in range(2, 31, 3):
            x, y = points[i]
            direction = -side
            draw.line((x - direction * 10 * scale, y - 7 * scale,
                       x + direction * 10 * scale, y + 7 * scale),
                      fill="#b82d48", width=max(2, round(3 * scale)))

    for step in range(40):
        a = pi * (.15 + step / 39 * .7)
        x = 256 - 169 * cos(a)
        y = 335 + 85 * sin(a)
        draw.ellipse(box((x - 5, y - 5, x + 5, y + 5)), fill="#2ee6d6")
    return canvas


if __name__ == "__main__":
    icons = Path(__file__).resolve().parents[1] / "public" / "icons"
    for dimension in (192, 512):
        icon(dimension).save(icons / f"icon-{dimension}.png", optimize=True)
