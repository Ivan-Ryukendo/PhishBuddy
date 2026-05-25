const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const contentContext = {
  URL,
  clearTimeout,
  document: {
    documentElement: { appendChild() {} },
    createElement() {
      return {
        appendChild() {},
        addEventListener() {},
        setAttribute() {},
      };
    },
  },
  location: { href: "https://example.com/" },
  module: { exports: {} },
  setInterval() {},
  setTimeout() {},
  window: {
    browser: null,
    chrome: null,
    getComputedStyle() {
      return { display: "block", visibility: "visible", opacity: "1" };
    },
  },
};
contentContext.window.window = contentContext.window;
contentContext.window.document = contentContext.document;
contentContext.window.location = contentContext.location;
contentContext.window.module = contentContext.module;
contentContext.window.URL = URL;

vm.createContext(contentContext);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../src/content.js"), "utf8"),
  contentContext,
);

const { getNoticeState } = contentContext.module.exports;

const cleanVerifiedNotIndexed = {
  verdict: "clean",
  signals: {
    domainRecord: { status: "verified", domain: "services.nidw.gov.bd" },
    indexedDomain: { status: "not_indexed" },
  },
};

assert.strictEqual(getNoticeState(cleanVerifiedNotIndexed), "clean");
assert.strictEqual(
  getNoticeState({
    verdict: "clean",
    signals: {
      indexedDomain: { status: "not_indexed" },
    },
  }),
  "notIndexed",
);
assert.strictEqual(
  getNoticeState({
    verdict: "suspicious",
    signals: {
      domainRecord: { status: "verified", domain: "services.nidw.gov.bd" },
      indexedDomain: { status: "not_indexed" },
    },
  }),
  "suspicious",
);

const backgroundMessages = {};
const backgroundContext = {
  URL,
  module: { exports: {} },
  URLSearchParams,
  chrome: {
    runtime: {
      getURL(pathname) {
        return `chrome-extension://phishbuddy/${pathname}`;
      },
      onMessage: {
        addListener(listener) {
          backgroundMessages.runtime = listener;
        },
      },
    },
    tabs: {
      sendMessage() {},
      update() {},
    },
    webNavigation: {
      onBeforeNavigate: {
        addListener(listener) {
          backgroundMessages.navigation = listener;
        },
      },
    },
  },
  PhishBuddyConfig: {},
  PhishBuddyApi: {},
};

vm.createContext(backgroundContext);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../src/background.js"), "utf8"),
  backgroundContext,
);

const { shouldShowNotice } = backgroundContext.module.exports;

assert.strictEqual(shouldShowNotice(cleanVerifiedNotIndexed), false);
assert.strictEqual(
  shouldShowNotice({
    verdict: "clean",
    signals: {
      indexedDomain: { status: "not_indexed" },
    },
  }),
  true,
);
assert.strictEqual(
  shouldShowNotice({
    verdict: "suspicious",
    signals: {
      domainRecord: { status: "verified", domain: "services.nidw.gov.bd" },
      indexedDomain: { status: "not_indexed" },
    },
  }),
  true,
);
assert.strictEqual(
  shouldShowNotice({
    verdict: "dangerous",
    signals: {
      domainRecord: { status: "blocked", domain: "phishing.example" },
    },
  }),
  false,
);
