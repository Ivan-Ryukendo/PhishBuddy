import { mkdir, rm, cp, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extensionRoot = join(root, "extension");
const distRoot = join(root, "dist", "extension-source");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

for (const entry of [
  "src",
  "assets",
  "popup.html",
  "popup.css",
  "warning.html",
  "warning.css",
  "manifest.chrome.json",
  "manifest.firefox.json",
]) {
  await cp(join(extensionRoot, entry), join(distRoot, entry), {
    recursive: true,
  });
}

const configuredApiBaseUrl = await readConfiguredApiBaseUrl();
if (configuredApiBaseUrl) {
  const configPath = join(distRoot, "src", "config.js");
  const configSource = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    configSource.replace(
      'var DEFAULT_API_BASE_URL = "";',
      `var DEFAULT_API_BASE_URL = ${JSON.stringify(configuredApiBaseUrl)};`,
    ),
  );
}

console.log(`Built extension source at ${distRoot}`);

async function readConfiguredApiBaseUrl() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const envText = await readFile(join(root, fileName), "utf8");
      const match = envText.match(/^CONVEX_SITE_URL=(.+)$/m) ??
        envText.match(/^PHISHBUDDY_API_BASE_URL=(.+)$/m);
      if (match?.[1]) {
        return match[1].trim().replace(/\/+$/, "");
      }
    } catch (error) {
      if (error && error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return "";
}
