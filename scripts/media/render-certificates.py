"""Render certificate PDFs (page 1) to PNG for the portfolio's credential gallery.

Usage: python scripts/media/render-certificates.py <folder-with-pdfs> [...more folders]
Output: assets-source/certificates/<slug>.png  (originals are only read, never changed)
"""
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

OUT = Path(__file__).resolve().parents[2] / 'assets-source' / 'certificates'
OUT.mkdir(parents=True, exist_ok=True)

# filename keyword (case-insensitive) -> slug; first match wins
RULES = [
    ('openscience', 'nasa-open-science'),
    ('soliya', 'soliya-dialogue-facilitation'),
    ('ai_engineer', 'datacamp-ai-engineer'),
    ('statementofresult', 'cambridge-statement-upload'),
    ('code_it_up_5', 'code-it-up-5'),
    ('python_data_associate', 'datacamp-python-data-associate'),
    ('certiport', 'certiport-it-specialist-ai'),
    ('nvidia', 'nvidia-deep-learning'),
    ('python_essentials_2', 'cisco-python-essentials-2'),
    ('python_1_sesame', 'cisco-python-essentials-1-course'),
    ('python_1_certif', 'cisco-python-essentials-1'),
    ('c_essential', 'cisco-c-essentials-1'),
    ('ccna', 'cisco-ccna-itn'),
    ('numpy', 'datacamp-numpy'),
    ('chatgpt', 'datacamp-intro-chatgpt'),
    ('eu_ai_act', 'datacamp-eu-ai-act'),
    ('data_literacy', 'datacamp-data-literacy'),
    ('github', 'datacamp-github-concepts'),
]


def slug_for(name: str) -> str:
    low = name.lower()
    for key, slug in RULES:
        if key in low:
            return slug
    return re.sub(r'[^a-z0-9]+', '-', re.sub(r'^[0-9a-f]{8}-', '', low.rsplit('.', 1)[0])).strip('-')


for folder in sys.argv[1:]:
    for pdf in sorted(Path(folder).glob('*.pdf')):
        doc = fitz.open(pdf)
        page = doc[0]
        # ~2400 px on the long side regardless of paper size
        zoom = 2400 / max(page.rect.width, page.rect.height)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        slug = slug_for(pdf.name)
        pix.save(OUT / f'{slug}.png')
        print(f'{slug:36s} pages={doc.page_count} {pix.width}x{pix.height}  <- {pdf.name}')
