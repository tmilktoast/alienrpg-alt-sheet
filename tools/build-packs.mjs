// Compile the JSON sources in src/packs/<name>/ into the LevelDB compendium packs Foundry loads
// from packs/<name>/. Pass a directory to write the packs somewhere else (build.sh does).
// Foundry must not have the pack open, so stop the server before rebuilding packs/ in place.
import { readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = path.join(root, "src", "packs");
const out = path.resolve(process.argv[2] ?? path.join(root, "packs"));

for (const entry of await readdir(sources, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dest = path.join(out, entry.name);
  await rm(dest, { recursive: true, force: true });
  await compilePack(path.join(sources, entry.name), dest, { log: false });
  console.log(path.relative(root, dest));
}
