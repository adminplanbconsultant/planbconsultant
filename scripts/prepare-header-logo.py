"""Remove only the neutral backdrop; retain the approved RGB artwork unchanged."""
from pathlib import Path
from collections import deque
import sys
import json

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / 'tmp/pdf-tools'))
from PIL import Image

results = []
for locale in ['en', 'ar']:
    original = Image.open(root / f'public/images/plan-b-logo-{locale}.png').convert('RGBA')
    image = original.copy()
    width, height = image.size
    pixels = image.load()
    # Only pale neutral pixels qualify as backdrop. Green/gold artwork is excluded.
    def background(x, y):
        r, g, b, a = pixels[x, y]
        return a == 0 or (min(r, g, b) >= 175 and max(r, g, b) - min(r, g, b) <= 32)
    visited = bytearray(width * height)
    queue = deque()
    def add(x, y):
        index = y * width + x
        if not visited[index] and background(x, y):
            visited[index] = 1
            queue.append((x, y))
    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)
    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        if x: add(x - 1, y)
        if x + 1 < width: add(x + 1, y)
        if y: add(x, y - 1)
        if y + 1 < height: add(x, y + 1)
    # The tagline's enclosed letter counters contain the same neutral backdrop.
    # This band is below the emblem, so no emblem highlight is touched.
    for y in range(790, height):
        for x in range(width):
            if background(x, y):
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    bbox = image.getchannel('A').getbbox()
    if not bbox or bbox[0] < 250 or bbox[2] > 1450:
        raise RuntimeError(f'Unexpected artwork bounds: {bbox}')
    # RGB values are unchanged even at the transparent boundary.
    assert image.convert('RGB').tobytes() == original.convert('RGB').tobytes()
    cropped = image.crop(bbox)
    cropped.save(root / f'public/images/plan-b-header-{locale}.png', optimize=True)
    crest = image.crop((437, 12, 1263, 787))
    # Arabic tagline ascenders enter this crop: keep only the connected crest.
    alpha = crest.getchannel('A')
    connected = Image.new('L', crest.size, 0)
    pending = deque([(crest.width // 2, crest.height // 2)])
    while pending:
        x, y = pending.popleft()
        if not (0 <= x < crest.width and 0 <= y < crest.height):
            continue
        if connected.getpixel((x, y)) or not alpha.getpixel((x, y)):
            continue
        connected.putpixel((x, y), alpha.getpixel((x, y)))
        pending.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    crest.putalpha(connected)
    crest = crest.crop(crest.getchannel('A').getbbox())
    crest.save(root / f'public/images/plan-b-header-crest-{locale}.png', optimize=True)
    results.append({'locale': locale, 'original': original.size, 'crop': bbox,
                    'size': cropped.size, 'alphaRange': cropped.getchannel('A').getextrema(),
                    'rgbUnchanged': True, 'emblemHeightInSource': 775})
out = root / 'artifacts/header-logo'
out.mkdir(parents=True, exist_ok=True)
(out / 'asset-validation.json').write_text(json.dumps(results, indent=2), encoding='utf8')
print(json.dumps(results, indent=2))
