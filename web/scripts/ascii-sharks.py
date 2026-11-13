"""Turn public/sharks/<slug>.(jpg|png|webp) into ASCII art at lib/shark-ascii.json.

Run from web/:  python3 scripts/ascii-sharks.py
Re-run whenever you add or change a portrait. Needs Pillow (pip install pillow).
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "sharks"
OUT = ROOT / "lib" / "shark-ascii.json"

COLS = 56          # characters wide
ASPECT = 0.5       # a monospace glyph is ~twice as tall as it is wide
RAMP = " .:-=+*#%@"  # dark -> light (we render light text on dark, so bright pixels get dense glyphs)

def to_ascii(path: Path) -> str:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img).convert("RGBA")
    # flatten transparency onto black, then grayscale
    bg = Image.new("RGBA", img.size, (0, 0, 0, 255)); bg.alpha_composite(img); img = bg.convert("L")
    # crop to 4:5 portrait, centered on the top third (faces usually sit high)
    w, h = img.size
    target = 4 / 5
    if w / h > target:
        nw = int(h * target); x0 = (w - nw) // 2; img = img.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / target); img = img.crop((0, 0, w, nh))
    img = ImageOps.autocontrast(img, cutoff=2)
    # light background? sample the border; if it's bright, invert so the background goes quiet
    w, h = img.size; px = img.load()
    border = [px[x, y] for x in range(0, w, max(1, w // 40)) for y in (0, h - 1)] + [px[x, y] for y in range(0, h, max(1, h // 40)) for x in (0, w - 1)]
    if sum(border) / len(border) > 128:
        img = ImageOps.invert(img)
        px = img.load()
        border = [255 - b for b in border]
    # treat the background's brightness as black so flat backdrops of any shade go quiet
    level = min(200, int(sum(border) / len(border)) + 18)
    img = img.point(lambda v: 0 if v <= level else int((v - level) * 255 / (255 - level)))
    rows = int(COLS / target * ASPECT)
    img = img.resize((COLS, rows), Image.LANCZOS)
    px = img.load()
    lines = []
    for y in range(rows):
        line = "".join(RAMP[min(len(RAMP) - 1, px[x, y] * len(RAMP) // 256)] for x in range(COLS))
        lines.append(line.rstrip())
    return "\n".join(lines)

def main() -> None:
    out = {}
    for p in sorted(SRC.glob("*")):
        if p.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        out[p.stem] = to_ascii(p)
        print(f"  {p.stem}: {len(out[p.stem].splitlines())} rows")
    OUT.write_text(json.dumps(out, indent=0))
    print(f"wrote {len(out)} portraits -> {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
