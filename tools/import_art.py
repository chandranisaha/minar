"""
Import hand-made / generated art into the game.

  python tools/import_art.py [source_dir]      (default: ./graphics in the repo)

Scans PNG/WebP files, matches them to ArtSlot names by filename keyword, trims transparent
borders, resizes, and writes public/art/<slot>.webp + public/art/manifest.json (natural sizes).
Re-run any time you add or replace a file. Unmatched files are listed so you can rename them.
"""
import json, os, sys
import numpy as np
from PIL import Image

RULES = [  # (keywords any-of, slot, max width)
    (['charminar'], 'charminar', 1000),
    (['bangle'], 'shop-plan', 640),
    (['chai', 'irani', 'cafe', 'café'], 'shop-save', 640),
    (['pearl'], 'shop-invest', 640),
    (['recharge', 'kiosk', 'upi', 'phone shop', 'mobile'], 'shop-safe', 640),
    (['rangoli', 'plaza tile'], 'deco-rangoli', 900),
    (['cityscape', 'skyline', 'sunset'], 'bg-skyline', 1600),
    (['flower', 'jasmine'], 'story-flowers', 1100),
    (['receipt', 'fee'], 'receipt', 800),
    (['nani', 'grandmother', 'grandma'], 'nani', 600),
]
# two-sided alley frames: split at the widest empty gap into <slot>-left / <slot>-right
SPLIT = [(['mediterranean', 'open centre'], 'bld-a', 0.12), (['old-town', 'sunlit'], 'bld-b', 0.0)]  # (keywords, slot, crop-bottom fraction)
SKIP = ['character asset sheet', 'character game asset']

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'graphics')
out = os.path.join(root, 'public', 'art')
os.makedirs(out, exist_ok=True)
mf_path = os.path.join(out, 'manifest.json')
manifest = json.load(open(mf_path)) if os.path.exists(mf_path) else {}

done, unmatched = [], []
for fn in sorted(os.listdir(src)):
    if not fn.lower().endswith(('.png', '.webp', '.jpg', '.jpeg')):
        continue
    low = fn.lower()
    if any(s in low for s in SKIP):
        continue
    sp = next(((n, c) for keys, n, c in SPLIT if any(k in low for k in keys)), None)
    if sp:
        name, crop_b = sp
        im = Image.open(os.path.join(src, fn)).convert('RGBA')
        if crop_b:
            im = im.crop((0, 0, im.width, int(im.height * (1 - crop_b))))
        a = np.array(im.getchannel('A')) > 12
        cols = a.sum(axis=0)
        lo, hi = int(im.width * 0.3), int(im.width * 0.7)
        best, run0, bs, be = 0, None, lo, lo
        for x in range(lo, hi):
            if cols[x] == 0:
                run0 = x if run0 is None else run0
                if x - run0 + 1 > best:
                    best, bs, be = x - run0 + 1, run0, x
            else:
                run0 = None
        cut = (bs + be) // 2 if best else im.width // 2
        for side, box in (('left', (0, 0, cut, im.height)), ('right', (cut, 0, im.width, im.height))):
            part = im.crop(box)
            bb = part.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
            if bb:
                part = part.crop(bb)
            if part.width > 760:
                part = part.resize((760, round(part.height * 760 / part.width)), Image.LANCZOS)
            slot_name = f'{name}-{side}'
            part.save(os.path.join(out, slot_name + '.webp'), 'WEBP', quality=88, method=6)
            manifest[slot_name] = {'w': part.width, 'h': part.height, 'src': fn}
            done.append((fn, slot_name, part.size))
        continue
    slot = next(((s, w) for keys, s, w in RULES if any(k in low for k in keys)), None)
    if not slot:
        unmatched.append(fn)
        continue
    name, maxw = slot
    im = Image.open(os.path.join(src, fn)).convert('RGBA')
    bb = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    if bb:
        im = im.crop(bb)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name + '.webp'), 'WEBP', quality=88, method=6)
    manifest[name] = {'w': im.width, 'h': im.height, 'src': fn}
    done.append((fn, name, im.size))

json.dump(manifest, open(mf_path, 'w'), indent=1)
for fn, name, size in done:
    print(f'OK   {fn}  ->  /art/{name}.webp  {size[0]}x{size[1]}')
for fn in unmatched:
    print(f'??   {fn}  (no slot matched; rename with a keyword, e.g. "chai", "pearl", "recharge", "flower")')
