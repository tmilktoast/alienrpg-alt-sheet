#!/usr/bin/env bash
# Package the module as dist/<id>-<version>.zip for manual upload to a Foundry server.
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
git show HEAD:module.json > dist/module.json
echo "$out"
echo "dist/module.json"
