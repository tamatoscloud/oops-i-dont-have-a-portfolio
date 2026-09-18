"""Re-rasterize A4 pages sharper and rebuild contact-sheet thumbs."""

from __future__ import annotations

import json
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "Portfolio (1).pdf"
PAGES = ROOT / "public" / "pages"
THUMBS = ROOT / "public" / "thumbs"
CONTENT = ROOT / "src" / "content" / "issue.json"

DPI = 288
MAX_PAGE_EDGE = 2880
WEBP_QUALITY = 78
THUMB_WIDTH = 280


def fit_max_edge(im: Image.Image, max_edge: int) -> Image.Image:
    w, h = im.size
    longest = max(w, h)
    if longest <= max_edge:
        return im
    scale = max_edge / longest
    return im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def save_webp(im: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, "WEBP", quality=quality, method=6)


def main() -> None:
    issue = json.loads(CONTENT.read_text(encoding="utf-8"))
    doc = pymupdf.open(PDF)
    matrix = pymupdf.Matrix(DPI / 72, DPI / 72)
    page_meta: dict[int, dict[str, int | str]] = {}

    for chapter in issue["chapters"]:
        page_no = int(chapter["page"])
        if page_no in page_meta:
            chapter["pageWidth"] = page_meta[page_no]["width"]
            chapter["pageHeight"] = page_meta[page_no]["height"]
            continue
        pix = doc[page_no - 1].get_pixmap(matrix=matrix, alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        page = fit_max_edge(im, MAX_PAGE_EDGE)
        name = f"page-{page_no:02d}.webp"
        save_webp(page, PAGES / name, WEBP_QUALITY)
        page_meta[page_no] = {
            "src": f"/pages/{name}",
            "width": page.size[0],
            "height": page.size[1],
        }
        chapter["pageSrc"] = page_meta[page_no]["src"]
        chapter["pageWidth"] = page.size[0]
        chapter["pageHeight"] = page.size[1]
        print(f"page {name} {page.size}")

        pw, ph = page.size
        for panel in chapter["panels"]:
            panel["pageSrc"] = chapter["pageSrc"]
            l, t, w, h = panel["box"]
            x0 = max(0, int(l * pw))
            y0 = max(0, int(t * ph))
            x1 = min(pw, int((l + w) * pw))
            y1 = min(ph, int((t + h) * ph))
            crop = page.crop((x0, y0, max(x0 + 1, x1), max(y0 + 1, y1)))
            tw = THUMB_WIDTH
            th = max(1, int(crop.size[1] * (tw / crop.size[0])))
            thumb = crop.resize((tw, th), Image.Resampling.LANCZOS)
            thumb_name = Path(panel["thumb"]).name
            save_webp(thumb, THUMBS / thumb_name, 72)

    doc.close()
    CONTENT.write_text(json.dumps(issue, indent=2), encoding="utf-8")
    print(f"updated {CONTENT}")


if __name__ == "__main__":
    main()
