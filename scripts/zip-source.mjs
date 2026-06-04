// Builds a clean source ZIP for Mozilla AMO source-code submission.
// Includes only the files reviewers need to reproduce the extension build:
// the extension source, build scripts, package manifests, license, and the
// SOURCE_BUILD.md instructions. Never includes node_modules, dist, or .env.
//
// Path separators are forced to forward slashes so the archive is valid on AMO.

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { deflateRawSync, crc32 } from "node:zlib";
import { join, relative, sep, posix, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

// Exactly the files a reviewer needs to read and rebuild the extension.
const files = [
  "SOURCE_BUILD.md",
  "README.md",
  "LICENSE",
  "PRIVACY.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "extension/manifest.chrome.json",
  "extension/manifest.firefox.json",
  "extension/popup.html",
  "extension/popup.css",
  "extension/warning.html",
  "extension/warning.css",
  "extension/assets/icons/icon-16.png",
  "extension/assets/icons/icon-32.png",
  "extension/assets/icons/icon-48.png",
  "extension/assets/icons/icon-128.png",
  "extension/assets/icons/phishbuddy-ico.svg",
  "extension/assets/fonts/roboto-600.woff2",
  "extension/assets/fonts/mplus-rounded-1c-700.woff2",
  "extension/src/apiClient.js",
  "extension/src/background.js",
  "extension/src/config.js",
  "extension/src/content.js",
  "extension/src/pageRisk.js",
  "extension/src/popup.js",
  "extension/src/ui.js",
  "extension/src/warning.js",
  "scripts/build-extension.mjs",
  "scripts/package-extension.mjs",
  "scripts/zip-extension.mjs",
];

// Build the secret denylist at runtime from the local env files so no key
// literals are ever committed to this (public) script. Falls back to a generic
// Google API key shape. Refuses to package any source file containing a match.
function loadSecretMatchers() {
  const matchers = [/AIzaSy[0-9A-Za-z_-]{33}/]; // generic Google API key shape
  for (const fileName of [".env.local", ".env"]) {
    let text = "";
    try {
      text = readFileSync(join(root, fileName), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^[A-Z0-9_]*(?:KEY|TOKEN|SECRET)[A-Z0-9_]*=(.+)$/);
      const value = m?.[1]?.trim();
      if (value && value.length >= 12) {
        matchers.push(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      }
    }
  }
  return new RegExp(matchers.map((m) => (m instanceof RegExp ? m.source : m)).join("|"));
}

const SECRET = loadSecretMatchers();

function dosTime(date) {
  const t =
    ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() / 2)) &
    0xffff;
  const d =
    (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) &
    0xffff;
  return { t, d };
}

const localParts = [];
const central = [];
let offset = 0;

for (const rel of files) {
  const abs = join(root, rel.split("/").join(sep));
  const data = readFileSync(abs);
  if (SECRET.test(data.toString("latin1"))) {
    throw new Error(`Refusing to package: possible secret found in ${rel}`);
  }
  const name = relative(root, abs).split(sep).join(posix.sep);
  const nameBuf = Buffer.from(name, "utf8");
  const comp = deflateRawSync(data);
  const crc = crc32(data) >>> 0;
  const { t, d } = dosTime(statSync(abs).mtime);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(t, 10);
  local.writeUInt16LE(d, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comp.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  localParts.push(local, nameBuf, comp);

  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0);
  cen.writeUInt16LE(20, 4);
  cen.writeUInt16LE(20, 6);
  cen.writeUInt16LE(0, 8);
  cen.writeUInt16LE(8, 10);
  cen.writeUInt16LE(t, 12);
  cen.writeUInt16LE(d, 14);
  cen.writeUInt32LE(crc, 16);
  cen.writeUInt32LE(comp.length, 20);
  cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(nameBuf.length, 28);
  cen.writeUInt32LE(offset, 42);
  central.push(cen, nameBuf);

  offset += local.length + nameBuf.length + comp.length;
}

const centralBuf = Buffer.concat(central);
const localBuf = Buffer.concat(localParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(localBuf.length, 16);

const out = join(root, "dist", `phishbuddy-source-v${version}.zip`);
writeFileSync(out, Buffer.concat([localBuf, centralBuf, end]));
console.log(`Wrote ${out} (${files.length} files)`);
