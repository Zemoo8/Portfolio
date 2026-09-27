"""Contact sheet of screenshots: python scripts/qa/sheet.py <glob> <out.jpg> [cols] [width]"""
import glob
import os
import sys

from PIL import Image, ImageDraw

pattern, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
W = int(sys.argv[4]) if len(sys.argv) > 4 else 560
files = sorted(glob.glob(pattern))
ims = [Image.open(f) for f in files]
H = max(int(im.height * W / im.width) for im in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 8), rows * (H + 24)), 'white')
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * (W + 8), (i // cols) * (H + 24)
    sheet.paste(im.resize((W, int(im.height * W / im.width))), (x, y + 20))
    d.text((x + 4, y + 4), os.path.basename(f), fill='black')
sheet.save(out, quality=80)
print(sheet.size)
