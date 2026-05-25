const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = {
  module: { exports: {} },
  PhishBuddyConfig: {
    normalizeApiBaseUrl(value) {
      return String(value || "").replace(/\/+$/, "");
    }
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/apiClient.js"), "utf8"), context);

const { checkUrl, normalizeCheckResponse } = context.PhishBuddyApi;

const normalizedDangerous = normalizeCheckResponse({
  verdict: "dangerous",
  url: "https://example.com",
  reasons: ["Known phishing host"],
  signals: { source: "test" }
});

assert.strictEqual(JSON.stringify(normalizedDangerous), JSON.stringify({
  verdict: "dangerous",
  url: "https://example.com",
  reasons: ["Known phishing host"],
  signals: { source: "test" }
}));

assert.strictEqual(normalizeCheckResponse({ verdict: "unknown" }).verdict, "suspicious");

(async () => {
  const result = await checkUrl("https://api.example.com/", "https://example.com", (url, options) => {
    assert.strictEqual(url, "https://api.example.com/check-url");
    assert.strictEqual(options.method, "POST");
    assert.strictEqual(JSON.stringify(JSON.parse(options.body)), JSON.stringify({ url: "https://example.com" }));
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ verdict: "clean", url: "https://example.com", reasons: [], signals: {} })
    });
  });
  assert.strictEqual(result.verdict, "clean");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
