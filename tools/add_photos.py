#!/usr/bin/env python3
"""Resize photos into img/<project-id>/ and print the lines to paste into data.js.

Usage:   python3 tools/add_photos.py <project-id> photo1.jpg [photo2.heic ...]
Needs:   pip install pillow pillow-heif

Each photo is rotated upright, stripped of metadata (including GPS location),
and saved in three sizes: NN.webp (full view), NN-md.webp (card), NN-sm.webp (thumbnail).
"""
import os
import re
import sys

from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

FULL, MD, SM = 2000, 1000, 240


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    pid, files = sys.argv[1], sys.argv[2:]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "img", pid)
    os.makedirs(out, exist_ok=True)
    taken = [int(m.group(1)) for f in os.listdir(out) if (m := re.match(r"v?(\d+)", f))]
    n = max(taken, default=0)
    for f in files:
        n += 1
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        base = os.path.join(out, f"{n:02d}")
        full = im.copy()
        full.thumbnail((FULL, FULL), Image.LANCZOS)
        full.save(base + ".webp", quality=80, method=5)
        md = im.copy()
        md.thumbnail((MD, MD), Image.LANCZOS)
        md.save(base + "-md.webp", quality=78, method=5)
        ImageOps.fit(im, (SM, SM), Image.LANCZOS).save(base + "-sm.webp", quality=72, method=5)
        print(f'      {{ img: "img/{pid}/{n:02d}", w: {full.width}, h: {full.height} }},')


if __name__ == "__main__":
    main()
