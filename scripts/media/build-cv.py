"""Public copy of Ahmed's CV, without his phone number.

Reads  ../CV - English.pdf               (Ahmed's own file, in the folder above the site; never modified)
Writes public/cv/ahmed-baghouli-cv.pdf

The phone line is removed from the page itself (a true redaction: the text is deleted from the
content stream, not covered), and the location line above it moves down into its place so the
contact block stays together. Everything else — text, layout, links — is the original.
The script fails rather than write a file in which a phone number can still be found.
"""
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT.parent / 'CV - English.pdf'
OUT = ROOT / 'public' / 'cv' / 'ahmed-baghouli-cv.pdf'
PHONE = re.compile(r'\+?\d[\d\s().-]{7,}\d')  # +216 53 061 687 and the like
HEAD = 160  # the contact block sits in the first 160 pt of page 1


def lines(page):
    """(text, rect) for every text line of the page, top to bottom."""
    out = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans']).strip()
            if text:
                out.append((text, fitz.Rect(line['bbox'])))
    return sorted(out, key=lambda item: (item[1].y0, item[1].x0))


doc = fitz.open(SRC)
page = doc[0]
head = [(text, rect) for text, rect in lines(page) if rect.y1 < HEAD]
at = next((i for i, (text, _) in enumerate(head) if PHONE.fullmatch(text)), None)
if at is None or at == 0:
    sys.exit('build-cv: no phone line found in the header — check the CV layout before publishing')
(_, phone), (_, above) = head[at], head[at - 1]
drop = phone.y0 - above.y0  # one line of the contact block

# the line above, alone on an otherwise empty copy of the page: it is laid back one line lower
solo = fitz.open(SRC)
width, height = solo[0].rect.width, solo[0].rect.height
solo[0].add_redact_annot(fitz.Rect(0, 0, width, above.y0 - 0.5), fill=False)
solo[0].add_redact_annot(fitz.Rect(0, above.y1 + 0.5, width, height), fill=False)
solo[0].apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE, graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)

# on the real page only those two lines of text go; rules, underlines and links are untouched
page.add_redact_annot(phone, fill=False)
page.add_redact_annot(above, fill=False)
page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
page.show_pdf_page(page.rect + (0, drop, 0, drop), solo, 0)

doc.set_metadata({**doc.metadata, 'title': 'Ahmed Baghouli — CV', 'author': 'Ahmed Baghouli'})
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT, garbage=4, deflate=True, clean=True)

# never publish a file that still carries a phone number, in the text or in the raw bytes
check = fitz.open(OUT)
text = '\n'.join(p.get_text() for p in check)
raw = OUT.read_bytes()
digits = re.sub(r'\D', '', head[at][0])
if any(PHONE.fullmatch(line.strip()) for line in text.splitlines()) or digits in re.sub(r'\s', '', text) or digits.encode() in raw:
    OUT.unlink()
    sys.exit('build-cv: a phone number is still present — nothing was written')
print(f'{OUT.relative_to(ROOT)}  {len(check)} pages  {OUT.stat().st_size // 1024} KB  links: {sum(len(p.get_links()) for p in check)}')
