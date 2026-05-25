(function (global) {
  "use strict";

  var DEFAULT_API_BASE_URL = "";
  var STORAGE_KEY = "phishbuddyApiBaseUrl";

  function getRuntime() {
    return global.browser || global.chrome;
  }

  function normalizeApiBaseUrl(value) {
    var trimmed = String(value || "").trim();
    if (!trimmed) {
      return DEFAULT_API_BASE_URL;
    }
    return trimmed.replace(/\/+$/, "");
  }

  function getApiBaseUrl() {
    var runtime = getRuntime();
    if (!runtime || !runtime.storage || !runtime.storage.sync) {
      return Promise.resolve(DEFAULT_API_BASE_URL);
    }

    if (global.browser && runtime.storage.sync.get.length < 2) {
      return runtime.storage.sync.get(STORAGE_KEY).then(function (result) {
        return normalizeApiBaseUrl(result[STORAGE_KEY]);
      });
    }

    return new Promise(function (resolve) {
      runtime.storage.sync.get(STORAGE_KEY, function (result) {
        resolve(normalizeApiBaseUrl(result && result[STORAGE_KEY]));
      });
    });
  }

  function setApiBaseUrl(value) {
    var runtime = getRuntime();
    var normalized = normalizeApiBaseUrl(value);
    if (!runtime || !runtime.storage || !runtime.storage.sync) {
      return Promise.resolve(normalized);
    }

    var payload = {};
    payload[STORAGE_KEY] = normalized;

    if (global.browser && runtime.storage.sync.set.length < 2) {
      return runtime.storage.sync.set(payload).then(function () {
        return normalized;
      });
    }

    return new Promise(function (resolve) {
      runtime.storage.sync.set(payload, function () {
        resolve(normalized);
      });
    });
  }

  global.PhishBuddyConfig = {
    DEFAULT_API_BASE_URL: DEFAULT_API_BASE_URL,
    STORAGE_KEY: STORAGE_KEY,
    getApiBaseUrl: getApiBaseUrl,
    normalizeApiBaseUrl: normalizeApiBaseUrl,
    setApiBaseUrl: setApiBaseUrl
  };

  if (typeof module !== "undefined") {
    module.exports = global.PhishBuddyConfig;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
