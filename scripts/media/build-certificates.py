"""Certificate images for the site: crop, trim, and export responsive WebP.

Reads  assets-source/certificates/<slug>.png   (rendered from Ahmed's PDFs / captured from LinkedIn & Coursera)
Writes public/media/certificates/<slug>.webp (long side 1800) + <slug>-sm.webp (long side 760)
       src/data/certificate-dimensions.json
Only the slugs listed in PUBLISH are exported; nothing in assets-source is modified.
"""
import json
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'assets-source' / 'certificates'
OUT = ROOT / 'public' / 'media' / 'certificates'
OUT.mkdir(parents=True, exist_ok=True)

# slug -> explicit crop box (x0, y0, x1, y1) in source pixels, or None for auto-trim
PUBLISH = {
    'nvidia-deep-learning': (70, 300, 1630, 1795),  # strip the browser-print header/footer
    'certiport-it-specialist-ai': None,
    'datacamp-ai-engineer': None,
    'datacamp-python-data-associate': None,
    'datacamp-eu-ai-act': None,
    'ibm-prompt-engineering': None,
    'datacamp-intro-chatgpt': None,
    'datacamp-data-literacy': None,
    'datacamp-numpy': None,
    'cisco-ccna-itn': None,
    'cisco-python-essentials-2': None,
    'cisco-python-essentials-1-course': None,
    'cisco-c-essentials-1': None,
    'datacamp-github-concepts': None,
    'cambridge-statement-upload': None,  # the version Ahmed uploaded (photo blurred)
    'aspire-leaders': None,
    'soliya-dialogue-facilitation': None,
    'nasa-open-science': None,
    'code-it-up-5': None,
}


def autotrim(im: Image.Image) -> Image.Image:
    """Trim uniform near-white margins, keep a small breathing border."""
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 18 else 0)
    box = diff.getbbox()
    if not box:
        return im
    pad = int(max(im.size) * 0.012)
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


dims = {}
for slug, crop in PUBLISH.items():
    im = Image.open(SRC / f'{slug}.png').convert('RGB')
    im = im.crop(crop) if crop else autotrim(im)
    for suffix, long_side, q in (('', 1800, 82), ('-sm', 760, 78)):
        scale = min(1, long_side / max(im.size))
        out = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        out.save(OUT / f'{slug}{suffix}.webp', 'WEBP', quality=q, method=6)
        if suffix == '':
            dims[slug] = [out.width, out.height]
    print(f'{slug:36s} {dims[slug]}')

(ROOT / 'src' / 'data' / 'certificate-dimensions.json').write_text(json.dumps(dims, indent=1))
