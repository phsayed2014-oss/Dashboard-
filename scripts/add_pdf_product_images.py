#!/usr/bin/env python3
"""Insert product images beside item names in the medical quotation PDF."""

from __future__ import annotations

import io
import shutil
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/_____________________________8441.pdf"
)
PRODUCT_DIR = ROOT / "exports" / "pdf-product-images"
OUTPUT = ROOT / "exports" / "_____________________________8441_with_images.pdf"

# Row vertical centers (PDF points) for items that get photos
ROW_Y = {
    "wheelchair": 280.0,
    "bed": 312.0,
    "icare": 347.0,
    "geratherm": 381.0,
    "nebulizer": 415.0,
}

# Composite strip order (left → right): iCare, Geratherm, nebulizer, wheelchair, bed
COMPOSITE_KEYS = ["icare", "geratherm", "nebulizer", "wheelchair", "bed"]

IMG_RECT = (24, 0, 102, 0)  # x0, y0, x1, y1 — y filled per row
IMG_HEIGHT = 30


def _upscale(im: Image.Image, scale: int = 3) -> Image.Image:
    w, h = im.size
    im = im.resize((w * scale, h * scale), Image.Resampling.LANCZOS)
    im = ImageEnhance.Sharpness(im).enhance(1.35)
    return im


def _trim_white(im: Image.Image, pad: int = 4) -> Image.Image:
    rgb = im.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r < 245 or g < 245 or b < 245:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x <= min_x or max_y <= min_y:
        return im
    return rgb.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(w, max_x + pad),
            min(h, max_y + pad),
        )
    )


def _remove_top_left_overlay(im: Image.Image) -> Image.Image:
    """Mask pharmacy / watermark band often placed above product box (Geratherm photo)."""
    im = im.convert("RGB")
    w, h = im.size
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, int(w * 0.48), int(h * 0.20)), fill=(255, 255, 255))
    return im


def extract_composite_products(composite_path: Path, out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    im = Image.open(composite_path).convert("RGB")
    w, h = im.size
    n = len(COMPOSITE_KEYS)
    step = w / n
    paths: dict[str, Path] = {}
    for i, key in enumerate(COMPOSITE_KEYS):
        x0 = int(i * step)
        x1 = int((i + 1) * step) if i < n - 1 else w
        crop = _trim_white(im.crop((x0, 0, x1, h)))
        crop = _upscale(crop)
        if key == "geratherm":
            crop = _remove_top_left_overlay(crop)
        dest = out_dir / f"{key}.png"
        crop.save(dest, optimize=True)
        paths[key] = dest
    return paths


def extract_assets_from_pdf(src: Path, assets_dir: Path) -> tuple[Path, Path, Path]:
    assets_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(src)
    page = doc[0]
    xrefs = [img[0] for img in page.get_images(full=True)]
    paths = []
    for i, xref in enumerate(xrefs):
        info = doc.extract_image(xref)
        p = assets_dir / f"embedded_{i}.{info['ext']}"
        p.write_bytes(info["image"])
        paths.append(p)
    doc.close()
    # 0=logo, 1=product composite, 2-3=blank bands, 4=footer
    return paths[0], paths[1], paths[4]


def load_product_images(src_pdf: Path) -> dict[str, Path]:
    custom_dir = src_pdf.parent / "product-images"
    if custom_dir.is_dir():
        mapping = {
            "icare": ["icare.png", "icare.jpg", "icare.jpeg", "icare.webp"],
            "geratherm": ["geratherm.png", "geratherm.jpg", "geratherm.jpeg"],
            "nebulizer": ["nebulizer.png", "nebulizer.jpg", "nebulizer.jpeg"],
            "wheelchair": ["wheelchair.png", "wheelchair.jpg", "wheelchair.jpeg"],
            "bed": ["bed.png", "bed.jpg", "bed.jpeg"],
        }
        resolved: dict[str, Path] = {}
        for key, names in mapping.items():
            for name in names:
                p = custom_dir / name
                if p.exists():
                    resolved[key] = p
                    break
        if len(resolved) == len(mapping):
            out: dict[str, Path] = {}
            PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
            for k, p in resolved.items():
                im = Image.open(p).convert("RGB")
                if k == "geratherm" and im.height / im.width > 1.05:
                    im = _remove_top_left_overlay(im)
                dest = PRODUCT_DIR / f"{k}.png"
                im.save(dest, optimize=True)
                out[k] = dest
            return out

    _, composite, _ = extract_assets_from_pdf(src_pdf, PRODUCT_DIR / "embedded")
    return extract_composite_products(composite, PRODUCT_DIR)


def verify_numbers_unchanged(before: str, after: str) -> None:
    import re

    nums_before = re.findall(r"[0-9][0-9,.\s%]*[0-9]|[0-9]+", before)
    nums_after = re.findall(r"[0-9][0-9,.\s%]*[0-9]|[0-9]+", after)
    if nums_before != nums_after:
        raise RuntimeError("Numeric text in PDF changed after edit — aborting.")


def build_pdf(src: Path, dst: Path) -> None:
    products = load_product_images(src)

    doc = fitz.open(src)
    page = doc[0]
    text_before = page.get_text()

    for xref in {img[0] for img in page.get_images(full=True)}:
        page.delete_image(xref)

    # Letterhead logo (top)
    logo_path, _, footer_path = extract_assets_from_pdf(src, PRODUCT_DIR / "embedded")
    page.insert_image(fitz.Rect(200, 8, 520, 72), filename=str(logo_path))

    # Footer band
    page.insert_image(fitz.Rect(24, 718, 588, 785), filename=str(footer_path))

    x0, _, x1, _ = IMG_RECT
    for key, y in ROW_Y.items():
        y0 = y - IMG_HEIGHT / 2
        y1 = y + IMG_HEIGHT / 2
        rect = fitz.Rect(x0, y0, x1, y1)
        page.insert_image(rect, filename=str(products[key]), keep_proportion=True)

    text_after = page.get_text()
    verify_numbers_unchanged(text_before, text_after)

    dst.parent.mkdir(parents=True, exist_ok=True)
    doc.save(dst, garbage=4, deflate=True)
    doc.close()


def main() -> None:
    src = DEFAULT_SRC
    if not src.exists():
        raise SystemExit(f"Source PDF not found: {src}")
    build_pdf(src, OUTPUT)
    upload_copy = src.parent / (src.stem + "_with_images.pdf")
    shutil.copy2(OUTPUT, upload_copy)
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {upload_copy}")


if __name__ == "__main__":
    main()
