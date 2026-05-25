import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(root, "dist", "extension-source");
const packageRoot = join(root, "dist", "extension");

await rm(packageRoot, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });

await createPackage("chrome", "manifest.chrome.json");
await createPackage("firefox", "manifest.firefox.json");

console.log(`Packaged browser extensions at ${packageRoot}`);

async function createPackage(name, manifestName) {
  const target = join(packageRoot, name);
  await mkdir(target, { recursive: true });

  for (const entry of [
    "src",
    "popup.html",
    "popup.css",
    "warning.html",
    "warning.css",
  ]) {
    await cp(join(sourceRoot, entry), join(target, entry), { recursive: true });
  }

  const manifest = await readFile(join(sourceRoot, manifestName), "utf8");
  JSON.parse(manifest);
  await writeFile(join(target, "manifest.json"), manifest);
}
