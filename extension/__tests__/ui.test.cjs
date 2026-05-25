const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = { module: { exports: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/ui.js"), "utf8"), context);

const { getVerdictDisplay } = context.PhishBuddyUi;

assert.strictEqual(getVerdictDisplay("clean").title, "Clean");
assert.strictEqual(getVerdictDisplay("suspicious").title, "Suspicious");
assert.strictEqual(getVerdictDisplay("dangerous").title, "Dangerous");
assert.strictEqual(getVerdictDisplay("not-real").title, "Suspicious");
