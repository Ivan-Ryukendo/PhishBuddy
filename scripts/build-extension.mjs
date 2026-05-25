import { mkdir, rm, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionRoot = join(root, "extension");
const distRoot = join(root, "dist", "extension-source");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

for (const entry of [
  "src",
  "popup.html",
  "popup.css",
  "options.html",
  "warning.html",
  "warning.css",
  "manifest.chrome.json",
  "manifest.firefox.json",
]) {
  await cp(join(extensionRoot, entry), join(distRoot, entry), {
    recursive: true,
  });
}

console.log(`Built extension source at ${distRoot}`);
