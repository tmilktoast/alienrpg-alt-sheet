#!/usr/bin/env bash
# Package the module as dist/<id>-<version>.zip for manual upload to a Foundry server.
# The compendium packs are compiled from src/packs/ on the way (needs `npm install` once).
# The zip holds a single <id>/ folder, so it unzips directly into Data/modules/.
# dist/module.json is a copy of the manifest to attach to the GitHub release alongside the zip,
# so the "latest" manifest URL resolves.
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

git show HEAD:module.json > dist/module.json
echo "$out"
echo "dist/module.json"
