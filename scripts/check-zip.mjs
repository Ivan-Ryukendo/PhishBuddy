import { readFileSync } from "node:fs";

const path = process.argv[2];
const data = readFileSync(path);

const backslash = Buffer.from("src\\", "latin1");
const forward = Buffer.from("src/", "latin1");

const hasBackslash = data.indexOf(backslash) !== -1;
const hasForward = data.indexOf(forward) !== -1;

console.log(`File: ${path}`);
console.log(`  backslash 'src\\' present:`, hasBackslash);
console.log(`  forward   'src/' present:`, hasForward);
console.log(
  hasBackslash
    ? "  => INVALID for AMO (backslash separators)"
    : "  => OK (forward-slash separators)",
);
