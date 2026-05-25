const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = { module: { exports: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/ui.js"), "utf8"), context);

const { getDisplayState, getVerdictDisplay } = context.PhishBuddyUi;

assert.strictEqual(getVerdictDisplay("clean").title, "Secure");
assert.strictEqual(getVerdictDisplay("suspicious").title, "Caution");
assert.strictEqual(getVerdictDisplay("dangerous").title, "Dangerous");
assert.strictEqual(getVerdictDisplay("not-real").title, "Caution");
assert.strictEqual(
  getDisplayState({
    verdict: "clean",
    signals: {
      indexedDomain: {
        status: "not_indexed",
      },
    },
  }),
  "notIndexed",
);
