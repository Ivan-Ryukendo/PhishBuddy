import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, crc32 } from "node:zlib";

// Minimal ZIP writer that always stores forward-slash paths, so archives are
// valid on every platform (PowerShell's Compress-Archive writes backslashes on
// Windows, which Firefox/AMO rejects: "Invalid file name in archive").

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "dist", "extension");
const outDir = join(root, "dist");

const targets = [
  { dir: join(packageRoot, "chrome"), out: "phishbuddy-chrome" },
  { dir: join(packageRoot, "firefox"), out: "phishbuddy-firefox" },
];

const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = pkg.version;

for (const target of targets) {
  const zipPath = join(outDir, `${target.out}-v${version}.zip`);
  await zipDirectory(target.dir, zipPath);
  console.log(`Wrote ${zipPath}`);
}

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function zipDirectory(sourceDir, zipPath) {
  await mkdir(dirname(zipPath), { recursive: true });
  const files = await listFiles(sourceDir);

  const central = [];
  const chunks = [];
  let offset = 0;

  for (const file of files) {
    const data = await readFile(file);
    // Force forward slashes regardless of host OS.
    const name = relative(sourceDir, file).split(sep).join(posix.sep);
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data) >>> 0;
    const compressed = deflateRawSync(data);
    const method = compressed.length < data.length ? 8 : 0;
    const body = method === 8 ? compressed : data;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0x21, 12); // mod date (arbitrary valid)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, body);
    const localHeaderOffset = offset;
    offset += local.length + nameBuf.length + body.length;

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(localHeaderOffset, 42);
    central.push(Buffer.concat([cd, nameBuf]));
  }

  const centralBuf = Buffer.concat(central);
  const centralOffset = offset;

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  const stream = createWriteStream(zipPath);
  for (const c of chunks) stream.write(c);
  stream.write(centralBuf);
  stream.write(end);
  await new Promise((resolve, reject) => {
    stream.end(resolve);
    stream.on("error", reject);
  });
}
