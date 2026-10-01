"""Export an explicit source/preview allowlist, never runtime or secret files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent.parent
archive = root / 'Plan-B-Consultant-content-complete-2026-10-01.zip'
folders = ['app', 'components', 'database', 'hooks', 'lib', 'public', 'scripts', 'vendor']
files = ['.env.example', '.gitignore', 'package.json', 'package-lock.json', 'next-env.d.ts',
         'next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'tokens.css', 'design.md',
         'README.md', 'ASSET-SOURCES.json', 'CONTENT-REVIEW.md', 'VALIDATION.md',
         'PROGRAMME-PAGES-HANDOVER.md', 'CLIENT-CONTENT-CHECKLIST.md', 'CONTENT-COMPLETION-HANDOVER.md']
selected = [root / name for name in files]
for folder in folders:
    selected.extend(p for p in (root / folder).rglob('*') if p.is_file())
selected.extend(p for p in (root / 'artifacts/content-completion').iterdir() if p.suffix in ['.png', '.jpg', '.json', '.html'])
for p in selected:
    if p.is_symlink() or root not in p.resolve().parents:
        raise RuntimeError(f'Unexpected source path: {p}')
    if p.name.startswith('.env') and p.name != '.env.example':
        raise RuntimeError('Secret environment file selected')
    if any(part in ['node_modules', '.git', '.next', 'tmp', 'Default'] for part in p.relative_to(root).parts):
        raise RuntimeError('Runtime or browser-profile file selected')
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(set(selected)):
        z.write(p, 'planbconsultant/' + p.relative_to(root).as_posix())
with ZipFile(archive) as z:
    assert z.testzip() is None
    names = z.namelist()
    assert 'planbconsultant/.env.example' in names
    assert not any('/.env' in name and not name.endswith('/.env.example') for name in names)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
print(json.dumps({'archive': str(archive), 'files': len(names), 'bytes': archive.stat().st_size, 'sha256': digest}, indent=2))
