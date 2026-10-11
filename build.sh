#!/usr/bin/env bash
# Package the module as dist/<id>-<version>.zip for manual upload to a Foundry server.
# The compendium packs are compiled from src/packs/ on the way (needs `npm install` once).
# The zip holds a single <id>/ folder, so it unzips directly into Data/modules/.
# dist/module.json is the manifest to attach to the GitHub release alongside the zip, so the
# "latest" manifest URL resolves. It matches the one in the zip, which names the stylesheets by version.
set -euo pipefail
cd "$(dirname "$0")"

id=$(python3 -c 'import json; print(json.load(open("module.json"))["id"])')
version=$(python3 -c 'import json; print(json.load(open("module.json"))["version"])')
out="dist/${id}-${version}.zip"

mkdir -p dist
git archive --format=zip --prefix="${id}/" -o "$out" HEAD \
  module.json README.md CHANGELOG.md LICENSE lang scripts styles templates

# packs/ is build output, so it is not in git: compile it fresh and add it to the zip.
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
node tools/build-packs.mjs "$tmp/${id}/packs" > /dev/null
python3 - "$out" "$tmp" <<'PY'
import os, sys, zipfile
out, root = sys.argv[1:]
with zipfile.ZipFile(out, "a", zipfile.ZIP_DEFLATED) as z:
    for folder, _, files in sorted(os.walk(root)):
        for name in sorted(files):
            if name == "LOCK":
                continue
            full = os.path.join(folder, name)
            z.write(full, os.path.relpath(full, root))
PY

# A browser, or a host's cache in front of it, can keep serving the last release's stylesheet under
# the same address after an update, leaving new markup unstyled. So in the release each stylesheet
# carries the version in its name, which is an address nothing has cached.
git show HEAD:module.json > dist/module.json
python3 - "$out" "$id" "$version" dist/module.json <<'PY'
import json, os, sys, zipfile
out, mod, version, manifest_path = sys.argv[1:]
manifest = json.load(open(manifest_path))
renamed = {}
for style in manifest.get("styles", []):
    stem, ext = os.path.splitext(style)
    renamed[style] = f"{stem}-{version}{ext}"
manifest["styles"] = [renamed[style] for style in manifest.get("styles", [])]
text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
open(manifest_path, "w").write(text)

tmp = out + ".tmp"
with zipfile.ZipFile(out) as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
    for info in src.infolist():
        rel = info.filename[len(mod) + 1:]
        data = text.encode() if rel == "module.json" else src.read(info.filename)
        info.filename = f"{mod}/{renamed.get(rel, rel)}"
        dst.writestr(info, data)
os.replace(tmp, out)
PY

echo "$out"
echo "dist/module.json"
