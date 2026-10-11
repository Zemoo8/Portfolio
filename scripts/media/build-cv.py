"""Public copy of Ahmed's CV, without his phone number.

Reads  ../CV_Baghouli_Ahmed.pdf          (Ahmed's own file, in the folder above the site; never modified)
Writes public/cv/ahmed-baghouli-cv.pdf   (the Contact section links it when it exists)

The header reads "Ariana, Tunisia · +216 …", right-aligned. The phone number and the dot before it
are removed from the page itself (a true redaction: the text is deleted from the content stream,
not covered) and what is left of the line slides over to keep the block's edge. Everything else —
text, layout, links — is the original. The script fails rather than write a file in which a phone
number can still be read.
"""
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT.parent / 'CV_Baghouli_Ahmed.pdf'
OUT = ROOT / 'public' / 'cv' / 'ahmed-baghouli-cv.pdf'
PHONE = re.compile(r'\+?\d[\d\s().-]{7,}\d')  # +216 53 061 687 and the like
SEPARATORS = '  ·•|,'
HEAD = 170  # the contact block sits in the first 170 pt of page 1
NUDGE = 0.3  # keeps a redaction clear of the neighbouring glyph's edge


def box(chars):
    rect = fitz.Rect(chars[0]['bbox'])
    for char in chars[1:]:
        rect |= fitz.Rect(char['bbox'])
    return rect


def find_phone(page):
    """The header line carrying the phone number: (kept characters, removed characters, right-aligned?)."""
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            chars = [char for span in line['spans'] for char in span['chars']]
            text = ''.join(char['c'] for char in chars)
            found = PHONE.search(text)
            if not found or line['bbox'][3] > HEAD or sum(c.isdigit() for c in found.group()) < 8:
                continue
            start, end = found.span()
            while start and text[start - 1] in SEPARATORS:
                start -= 1
            if end < len(text.rstrip()) or not text[:start].strip():
                sys.exit('build-cv: the phone number is not at the end of a line of text — adapt the script to this layout')
            return chars[:start], chars[start:], line['bbox'][0] > page.rect.width / 2
    sys.exit('build-cv: no phone number found in the header — check the CV before publishing')


def only(rect):
    """A copy of page 1 with nothing on it but what lies inside rect."""
    solo = fitz.open(SRC)
    page = solo[0]
    width, height = page.rect.width, page.rect.height
    for around in (
        fitz.Rect(0, 0, width, rect.y0 - NUDGE),
        fitz.Rect(0, rect.y1 + NUDGE, width, height),
        fitz.Rect(0, rect.y0 - NUDGE, rect.x0 - NUDGE, rect.y1 + NUDGE),
        fitz.Rect(rect.x1 + NUDGE, rect.y0 - NUDGE, width, rect.y1 + NUDGE),
    ):
        page.add_redact_annot(around, fill=False)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE, graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
    return solo


doc = fitz.open(SRC)
page = doc[0]
before = ' '.join(p.get_text() for p in doc).split()
kept, removed, right_aligned = find_phone(page)
keep, cut = box(kept), box(removed)
cut.x0 = keep.x1 + NUDGE
number = ''.join(char['c'] for char in removed).strip(SEPARATORS)

# the rest of the line, alone on an otherwise empty copy of the page, is laid back against the edge
rest = only(keep)
page.add_redact_annot(cut, fill=False)
if right_aligned:
    page.add_redact_annot(keep, fill=False)
page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
if right_aligned:
    slide = cut.x1 - keep.x1
    page.show_pdf_page(page.rect + (slide, 0, slide, 0), rest, 0)

doc.set_metadata({**doc.metadata, 'author': 'Ahmed Baghouli'})
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT, garbage=4, deflate=True, clean=True)

# never publish a file that still carries a phone number: not in the text, not in a link, not in any object
check = fitz.open(OUT)
text = ' '.join(p.get_text() for p in check)
digits = re.sub(r'\D', '', number)
spellings = {number, number.replace(' ', ''), digits, digits[-8:], number.replace(' ', '%20'), number.split(' ', 1)[-1]}
objects = ' '.join(check.xref_object(xref) for xref in range(1, check.xref_length()))
expected = list(before)
for word in ''.join(char['c'] for char in removed).split():
    expected.remove(word)
problems = []
if digits in re.sub(r'\D', '', text) or any(spelling in text for spelling in spellings):
    problems.append('the number can still be read in the text')
if any(spelling in objects for spelling in spellings):
    problems.append('the number is still in a link or another object')
if sorted(text.split()) != sorted(expected):
    problems.append('other text changed')
if problems:
    OUT.unlink()
    sys.exit('build-cv: nothing was written — ' + '; '.join(problems))
print(f'{OUT.relative_to(ROOT)}  {len(check)} pages  {OUT.stat().st_size // 1024} KB  links: {sum(len(p.get_links()) for p in check)}')
