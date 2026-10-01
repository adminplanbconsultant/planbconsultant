"""Package a source allowlist and the search handover; exclude secrets/runtime/profiles."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parent.parent
archive=root/'Plan-B-Consultant-search-visibility-2026-10-02.zip'
files=['.env.example','.gitignore','package.json','package-lock.json','next-env.d.ts','next.config.ts','postcss.config.mjs','tsconfig.json','tokens.css','design.md','README.md','ASSET-SOURCES.json','CONTENT-REVIEW.md','VALIDATION.md','PROGRAMME-PAGES-HANDOVER.md','CLIENT-CONTENT-CHECKLIST.md','CONTENT-COMPLETION-HANDOVER.md','HERO-IMAGE-SOURCES.md','HERO-IMPLEMENTATION-REPORT.md','FLAG-ASSET-SOURCES.md','SEARCH-VISIBILITY-HANDOVER.md','SOURCE-REVIEW-LEDGER.md','BACKLINK-OPPORTUNITY-PLAN.md','SEARCH-VALIDATION-REPORT.md']
selected=[root/name for name in files]
for folder in ['app','components','database','hooks','lib','public','scripts','vendor','artifacts/search-visibility']:
 selected.extend(p for p in (root/folder).rglob('*') if p.is_file() and p.name!='archive-manifest.json')
for p in selected:
 rel=p.relative_to(root)
 if not p.exists() or p.is_symlink() or root not in p.resolve().parents:raise RuntimeError(f'Invalid path: {rel}')
 if any(part in ['node_modules','.git','.next','tmp','Default','.aws','.codex'] for part in rel.parts):raise RuntimeError(f'Runtime/profile: {rel}')
 if p.name.startswith('.env') and p.name!='.env.example':raise RuntimeError('Environment secret selected')
 if p.suffix.lower() in ['.pem','.key','.pfx','.p12']:raise RuntimeError('Key file selected')
 data=p.read_bytes()
 if b'-----BEGIN '+b'PRIVATE KEY-----' in data or b'-----BEGIN '+b'RSA PRIVATE KEY-----' in data:raise RuntimeError(f'Private key marker in {rel}')
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(set(selected)):z.write(p,'planbconsultant/'+p.relative_to(root).as_posix())
with ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist()
 assert not any('/.env' in n and not n.endswith('/.env.example') for n in names)
result={'archive':str(archive),'files':len(names),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'scope':'Source, public assets, docs and search-validation artifacts; excludes private env, runtime, Git and browser profiles'}
(root/'artifacts/search-visibility/archive-manifest.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
