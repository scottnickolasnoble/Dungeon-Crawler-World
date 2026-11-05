# Usage: python3 make_sheet.py <tier_dir> "<title>" key:"Name":"Lv" ...
import sys, glob
from PIL import Image, ImageDraw, ImageFont
d_, title, items = sys.argv[1], sys.argv[2], [a.split(':') for a in sys.argv[3:]]
fp = [f for f in glob.glob('/usr/share/fonts/**/*Bold*.ttf', recursive=True) if 'DejaVuSans' in f or 'Liberation' in f]
font = ImageFont.truetype(fp[0], 34); small = ImageFont.truetype(fp[0], 24)
W, H = 960, 540; rows = (len(items) + 1) // 2
s = Image.new('RGB', (W * 2, H * rows + 90), '#0d0b12'); d = ImageDraw.Draw(s)
d.text((24, 22), title, fill='#F5C518', font=font)
for i, (k, n, lv) in enumerate(items):
    im = Image.open(f'{d_}/{k}.png').resize((W, H)); x, y = (i % 2) * W, 90 + (i // 2) * H; s.paste(im, (x, y))
    tw = d.textlength(n.upper(), font=font)
    d.rectangle([x + 16, y + H - 70, x + 50 + tw + d.textlength(lv, font=small) + 20, y + H - 18], fill='#0d0b12')
    d.text((x + 30, y + H - 64), n.upper(), fill='#F4EEDC', font=font); d.text((x + 40 + tw, y + H - 58), lv, fill='#F5C518', font=small)
s.save(f'{d_}/sheet.png'); print(s.size)
