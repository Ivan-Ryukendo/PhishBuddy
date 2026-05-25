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

assert.strictEqual(
  getDisplayState({
    verdict: "clean",
    signals: {
      domainRecord: {
        status: "verified",
        domain: "services.nidw.gov.bd",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  }),
  "clean",
);

assert.strictEqual(
  getDisplayState({
    verdict: "suspicious",
    signals: {
      domainRecord: {
        status: "verified",
        domain: "services.nidw.gov.bd",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  }),
  "suspicious",
);

assert.strictEqual(
  getDisplayState({
    verdict: "suspicious",
    signals: {
      domainRecord: {
        status: "watchlist",
        domain: "example-login.net",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  }),
  "suspicious",
);

assert.strictEqual(
  getDisplayState({
    verdict: "dangerous",
    signals: {
      domainRecord: {
        status: "blocked",
        domain: "phishing.example",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  }),
  "dangerous",
);
