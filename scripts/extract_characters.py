"""Crop hero figures from the portfolio PDF for living character layers."""

from __future__ import annotations

import json
from pathlib import Path

from collections import deque

import pymupdf
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Portfolio (1).pdf"
OUT = ROOT / "public" / "characters"
CONTENT = ROOT / "src" / "content" / "issue.json"
DPI = 216

# page, id, chapterId, panelId, anchor, l, t, w, h
CAST = [
    (1, "salman-airport", "cover", "cover-airport", "right", 0.50, 0.20, 0.48, 0.56),
    (1, "salman-groupchat", "cover", "cover-quote", "right", 0.54, 0.52, 0.42, 0.40),
    (2, "salman-edit", "what-is-a-portfolio", "p2-award", "right", 0.52, 0.14, 0.44, 0.28),
    (2, "salman-kitchen", "what-is-a-portfolio", "p2-not-pointless", "right", 0.52, 0.40, 0.44, 0.28),
    (4, "salman-war-room", "building-strategy", "p4-war-room", "left", 0.22, 0.32, 0.28, 0.28),
    (4, "salman-powerpoint", "building-strategy", "p4-quote", "right", 0.60, 0.56, 0.36, 0.36),
    (7, "josh", "trenches-2", "p7-josh", "left", 0.06, 0.16, 0.28, 0.22),
    (7, "family-milk", "trenches-2", "p7-lifebuoy", "left", 0.06, 0.36, 0.28, 0.24),
    (8, "salman-behind", "behind-the-work", "p8-splash", "right", 0.32, 0.24, 0.42, 0.46),
    (9, "salman-wait", "interlude-wait", "p9-splash", "right", 0.56, 0.08, 0.40, 0.34),
    (9, "salman-point", "interlude-wait", "p9-method", "left", 0.04, 0.58, 0.36, 0.34),
    (10, "salman-pattern", "pattern", "p10-center", "right", 0.32, 0.16, 0.38, 0.44),
    (13, "salman-vintage", "vintage", "p13-splash", "right", 0.54, 0.08, 0.42, 0.36),
    (15, "salman-encore", "encore", "p15-splash", "right", 0.52, 0.48, 0.44, 0.42),
    (16, "salman-olpers", "olpers-deep", "p16-attack", "left", 0.04, 0.50, 0.34, 0.24),
    (17, "salman-last", "one-last", "p17-splash", "right", 0.30, 0.28, 0.48, 0.50),
    (19, "salman-wine", "colophon", "p19-splash", "right", 0.30, 0.16, 0.48, 0.54),
]


def crop_box(im: Image.Image, box: tuple[float, float, float, float]) -> Image.Image:
    w, h = im.size
    l, t, bw, bh = box
    x0 = max(0, int(l * w))
    y0 = max(0, int(t * h))
    x1 = min(w, int((l + bw) * w))
    y1 = min(h, int((t + bh) * h))
    return im.crop((x0, y0, x1, y1))


def is_paper(r: int, g: int, b: int) -> bool:
    luma = (r + g + b) / 3
    sat = max(r, g, b) - min(r, g, b)
    if luma > 226 and sat < 48:
        return True
    if luma > 208 and sat < 22:
        return True
    if r > 228 and g > 216 and b > 196 and sat < 56:
        return True
    return False


def knockout_paper(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    w, h = rgba.size
    factor = 5
    small = rgba.resize((max(8, w // factor), max(8, h // factor)), Image.Resampling.BILINEAR)
    sw, sh = small.size
    px = small.load()
    seen = bytearray(sw * sh)
    queue: deque[tuple[int, int]] = deque()

    def idx(x: int, y: int) -> int:
        return y * sw + x

    def seed(x: int, y: int) -> None:
        r, g, b, a = px[x, y]
        if a < 16 or seen[idx(x, y)] or not is_paper(r, g, b):
            return
        seen[idx(x, y)] = 1
        queue.append((x, y))

    for x in range(sw):
        seed(x, 0)
        seed(x, sh - 1)
    for y in range(sh):
        seed(0, y)
        seed(sw - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < sw and 0 <= ny < sh and not seen[idx(nx, ny)]:
                nr, ng, nb, na = px[nx, ny]
                if na >= 16 and is_paper(nr, ng, nb):
                    seen[idx(nx, ny)] = 1
                    queue.append((nx, ny))

    alpha = small.getchannel("A").resize((w, h), Image.Resampling.BILINEAR)
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=1.4))
    rgba.putalpha(alpha)
    return rgba.filter(ImageFilter.UnsharpMask(radius=1.1, percent=90, threshold=2))


def main() -> None:
    print("rasterizing pages...", flush=True)
    OUT.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)
    zoom = DPI / 72
    matrix = pymupdf.Matrix(zoom, zoom)
    pages: dict[int, Image.Image] = {}
    needed = {item[0] for item in CAST}
    for number in needed:
        pix = doc[number - 1].get_pixmap(matrix=matrix, alpha=False)
        pages[number] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        print("page", number, pages[number].size, flush=True)
    doc.close()

    characters = []
    for page, cid, chapter, panel, anchor, l, t, w, h in CAST:
        cut = knockout_paper(crop_box(pages[page], (l, t, w, h)))
        longest = max(cut.size)
        if longest > 1100:
            scale = 1100 / longest
            cut = cut.resize((int(cut.width * scale), int(cut.height * scale)), Image.Resampling.LANCZOS)
        name = f"{cid}.webp"
        cut.save(OUT / name, "WEBP", quality=86, method=6)
        characters.append(
            {
                "id": cid,
                "src": f"/characters/{name}",
                "chapterId": chapter,
                "panelId": panel,
                "page": page,
                "anchor": anchor,
                "x": l,
                "y": t,
                "w": w,
                "h": h,
                "width": cut.size[0],
                "height": cut.size[1],
            }
        )
        print("cast", name, cut.size, flush=True)

    issue = json.loads(CONTENT.read_text(encoding="utf-8"))
    issue["characters"] = characters
    CONTENT.write_text(json.dumps(issue, indent=2), encoding="utf-8")
    print("wrote", len(characters), "characters")


if __name__ == "__main__":
    main()
