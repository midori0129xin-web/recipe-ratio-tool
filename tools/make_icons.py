from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

BG = "#f7f1e5"
GREEN = "#1f5f5a"
GOLD = "#d8a33d"
BROWN = "#9a4536"
WHITE = "#ffffff"


def rounded_line(draw, points, fill, width):
    draw.line(points, fill=fill, width=width, joint="curve")
    radius = width // 2
    for x, y in points:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def draw_icon(size):
    scale = size / 512

    def s(value):
        return int(round(value * scale))

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle((0, 0, size, size), radius=s(108), fill=BG)
    draw.ellipse((s(339), s(79), s(433), s(173)), fill=GOLD)

    cup = [(s(155), s(146)), (s(339), s(146)), (s(308), s(372)), (s(286), s(394)), (s(208), s(394)), (s(186), s(372))]
    draw.polygon(cup, fill=WHITE)
    rounded_line(draw, [cup[0], cup[1], cup[2], cup[3], cup[4], cup[5], cup[0]], GREEN, s(24))

    rounded_line(draw, [(s(181), s(212)), (s(315), s(212))], GREEN, s(18))
    rounded_line(draw, [(s(193), s(269)), (s(303), s(269))], GREEN, s(18))
    rounded_line(draw, [(s(205), s(326)), (s(291), s(326))], GREEN, s(18))

    rounded_line(draw, [(s(339), s(192)), (s(369), s(192)), (s(397), s(220)), (s(369), s(276)), (s(327), s(276))], GREEN, s(24))
    rounded_line(draw, [(s(128), s(403)), (s(384), s(109))], BROWN, s(23))
    draw.ellipse((s(121), s(363), s(167), s(409)), fill=BROWN)
    draw.ellipse((s(345), s(103), s(391), s(149)), fill=BROWN)

    return image


for filename, size in {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
}.items():
    draw_icon(size).save(OUT / filename)

favicon_sizes = [16, 32, 48]
favicon_images = [draw_icon(size) for size in favicon_sizes]
favicon_images[-1].save(OUT / "favicon.ico", sizes=[(size, size) for size in favicon_sizes])

print("Generated icons in", OUT)
