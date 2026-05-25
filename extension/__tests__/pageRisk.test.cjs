const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = { module: { exports: {} }, URL };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/pageRisk.js"), "utf8"), context);

const { mergeResultWithPageRisk, summarizePageRisk } = context.PhishBuddyPageRisk;

const cleanRisk = summarizePageRisk({
  url: "https://example.com",
  scripts: [{ src: "https://example.com/app.js", sample: "" }],
  forms: [{ action: "https://example.com/login" }],
  frames: [],
  redirects: [],
});

assert.strictEqual(cleanRisk.status, "clean");
assert.strictEqual(cleanRisk.reasons.length, 0);

const suspiciousRisk = summarizePageRisk({
  url: "https://example.com",
  scripts: [{ src: "", sample: "eval(atob('abc'))" }],
  forms: [{ action: "https://collector.example.net/login" }],
  frames: [{ src: "https://tracker.example.net/frame", hidden: true }],
  redirects: ["https://other.example.net"],
});

assert.strictEqual(suspiciousRisk.status, "suspicious");
assert.ok(suspiciousRisk.reasons.includes("Page contains heavily obfuscated or dynamic script patterns."));
assert.ok(suspiciousRisk.reasons.includes("A form sends data to a different domain."));
assert.ok(suspiciousRisk.reasons.includes("Hidden embedded content points to another domain."));
assert.ok(suspiciousRisk.reasons.includes("The tab appears to have redirected across domains."));

const merged = mergeResultWithPageRisk(
  { verdict: "clean", url: "https://example.com", reasons: [], signals: {} },
  suspiciousRisk,
);

assert.strictEqual(merged.verdict, "suspicious");
assert.strictEqual(merged.signals.pageRisk.status, "suspicious");

const trustedMerged = mergeResultWithPageRisk(
  {
    verdict: "clean",
    url: "https://github.com",
    reasons: ["github.com is in the indexed trusted-domain list."],
    signals: {
      indexedDomain: {
        status: "indexed",
        domain: "github.com",
        matchedDomain: "github.com",
        reasons: ["github.com is in the indexed trusted-domain list."],
      },
    },
  },
  suspiciousRisk,
);

assert.strictEqual(trustedMerged.verdict, "clean");
assert.strictEqual(trustedMerged.reasons.length, 1);
assert.strictEqual(trustedMerged.signals.pageRisk.suppressed, true);
