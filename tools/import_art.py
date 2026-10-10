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
from scipy import ndimage as ndi

RULES = [  # (keywords any-of, slot, max width)
    (['golden hour'], 'scene-charminar', 1500),
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
# sheet of loose props: cut by box (x0,y0,x1,y1 on the 1536x1024 sheet), keep the largest blob in each box
PROP_BOXES = {
    'tree': (5, 5, 655, 720), 'lamp': (10, 445, 190, 1000), 'bicycle': (420, 405, 815, 700), 'lights': (110, 760, 470, 1000),
    'pigeon-fly': (635, 735, 790, 880), 'pigeon-a': (520, 845, 650, 950), 'pigeon-b': (765, 820, 885, 945),
    'pot-big': (675, 95, 935, 355), 'pot-tall': (920, 110, 1070, 350), 'pot-small': (1075, 170, 1180, 345),
    'crates': (1215, 5, 1525, 350), 'cart': (900, 365, 1320, 745), 'waterpot': (1335, 370, 1500, 675), 'clothesline': (930, 745, 1500, 1000),
}

PROP_ERASE = {'tree': [(415, 500, 655, 720)]}  # sheet-space rects to blank before cutting (a bicycle overlaps the tree box)

def cut_props(path):
    sheet = Image.open(path).convert('RGBA')
    names = []
    for name, box in PROP_BOXES.items():
        part = sheet.crop(box)
        for ex0, ey0, ex1, ey1 in PROP_ERASE.get(name, []):
            arr0 = np.array(part)
            arr0[max(0, ey0 - box[1]):max(0, ey1 - box[1]), max(0, ex0 - box[0]):max(0, ex1 - box[0]), 3] = 0
            part = Image.fromarray(arr0, 'RGBA')
        a = np.array(part.getchannel('A')) > 12
        lab, n = ndi.label(ndi.binary_dilation(a, iterations=4))
        if n == 0:
            continue
        sizes = ndi.sum(a, lab, range(1, n + 1))
        keep = (lab == 1 + int(np.argmax(sizes))) & ndi.binary_dilation(a, iterations=1)
        arr = np.array(part)
        arr[..., 3] = np.where(keep, arr[..., 3], 0)
        part = Image.fromarray(arr, 'RGBA')
        part = part.crop(part.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox())
        if part.width > 700:
            part = part.resize((700, round(part.height * 700 / part.width)), Image.LANCZOS)
        slot = 'prop-' + name
        part.save(os.path.join(out, slot + '.webp'), 'WEBP', quality=88, method=6)
        manifest[slot] = {'w': part.width, 'h': part.height, 'src': os.path.basename(path)}
        names.append(slot)
    return names

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
    if 'prop collection' in low:
        for nm in cut_props(os.path.join(src, fn)):
            done.append((fn, nm, (manifest[nm]['w'], manifest[nm]['h'])))
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
