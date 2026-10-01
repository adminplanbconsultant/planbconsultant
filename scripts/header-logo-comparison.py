"""Arrange browser close-ups without resizing, preserving the visible size change."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / 'tmp/pdf-tools'))
from PIL import Image, ImageDraw, ImageFont

folder = root / 'artifacts/header-logo'
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
cases = [('en', 1440, 'English — desktop'), ('ar', 1440, 'Arabic — desktop'),
         ('en', 390, 'English — mobile'), ('ar', 390, 'Arabic — mobile')]
rows = []
for locale, width, label in cases:
    before = Image.open(folder / f'before-{locale}-{width}-closeup.png').convert('RGB')
    after = Image.open(folder / f'after-{locale}-{width}-closeup.png').convert('RGB')
    height = max(before.height, after.height) + 90
    row = Image.new('RGB', (1200, height), '#f4f2e9')
    draw = ImageDraw.Draw(row)
    draw.text((24, 12), label, font=font, fill='#194b2d')
    draw.text((24, 46), 'Before', font=font, fill='#194b2d')
    draw.text((624, 46), 'After', font=font, fill='#194b2d')
    row.paste(before, (24, 80))
    row.paste(after, (624, 80))
    rows.append(row)
sheet = Image.new('RGB', (1200, sum(row.height for row in rows)), '#f4f2e9')
y = 0
for row in rows:
    sheet.paste(row, (0, y))
    y += row.height
sheet.save(folder / 'before-after.png')
