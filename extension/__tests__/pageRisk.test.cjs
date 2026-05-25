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

const convexVerifiedMerged = mergeResultWithPageRisk(
  {
    verdict: "clean",
    url: "https://services.nidw.gov.bd/nid-pub/",
    reasons: ["services.nidw.gov.bd is verified in the public PhishBuddy index."],
    signals: {
      domainRecord: {
        status: "verified",
        domain: "services.nidw.gov.bd",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  },
  suspiciousRisk,
);

assert.strictEqual(convexVerifiedMerged.verdict, "clean");
assert.strictEqual(convexVerifiedMerged.reasons.length, 1);
assert.strictEqual(convexVerifiedMerged.signals.pageRisk.suppressed, true);

const suspiciousVerifiedMerged = mergeResultWithPageRisk(
  {
    verdict: "suspicious",
    url: "https://services.nidw.gov.bd/nid-pub/",
    reasons: ["A provider flagged this URL as suspicious."],
    signals: {
      domainRecord: {
        status: "verified",
        domain: "services.nidw.gov.bd",
      },
      indexedDomain: {
        status: "not_indexed",
      },
    },
  },
  suspiciousRisk,
);

assert.strictEqual(suspiciousVerifiedMerged.verdict, "suspicious");
assert.ok(suspiciousVerifiedMerged.reasons.includes("Page contains heavily obfuscated or dynamic script patterns."));

const watchlistMerged = mergeResultWithPageRisk(
  {
    verdict: "suspicious",
    url: "https://example-login.net",
    reasons: ["example-login.net is on the watchlist."],
    signals: {
      domainRecord: {
        status: "watchlist",
        domain: "example-login.net",
      },
    },
  },
  suspiciousRisk,
);

assert.strictEqual(watchlistMerged.verdict, "suspicious");
assert.ok(watchlistMerged.reasons.includes("Page contains heavily obfuscated or dynamic script patterns."));

const blockedMerged = mergeResultWithPageRisk(
  {
    verdict: "dangerous",
    url: "https://phishing.example",
    reasons: ["phishing.example is blocked."],
    signals: {
      domainRecord: {
        status: "blocked",
        domain: "phishing.example",
      },
    },
  },
  suspiciousRisk,
);

assert.strictEqual(blockedMerged.verdict, "dangerous");
