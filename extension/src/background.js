(function (global) {
  "use strict";

  if (typeof importScripts === "function" && !global.PhishBuddyConfig) {
    importScripts("config.js", "apiClient.js");
  }

  var runtime = global.browser || global.chrome;
  var pendingChecks = {};
  var latestResultsByUrl = {};
  var allowNextNavigationByTab = {};

  function getExtensionUrl(path) {
    return runtime.runtime.getURL(path);
  }

  function isCheckableUrl(url) {
    if (!url) {
      return false;
    }
    if (url.indexOf(getExtensionUrl("")) === 0) {
      return false;
    }
    try {
      var parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function makeWarningUrl(result) {
    var params = new URLSearchParams();
    params.set("url", result.url);
    params.set("verdict", result.verdict);
    return getExtensionUrl("warning.html") + "?" + params.toString();
  }

  function updateTab(tabId, url) {
    return new Promise(function (resolve) {
      var maybePromise = runtime.tabs.update(tabId, { url: url }, resolve);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(resolve, resolve);
      }
    });
  }

  function storeResult(result) {
    latestResultsByUrl[result.url] = {
      verdict: result.verdict,
      url: result.url,
      reasons: result.reasons,
      signals: result.signals,
      checkedAt: Date.now()
    };
  }

  function shouldShowNotice(result) {
    var indexedDomain = result &&
      result.signals &&
      result.signals.indexedDomain;
    var domainRecord = result &&
      result.signals &&
      result.signals.domainRecord;

    if (!result || result.verdict === "dangerous") {
      return false;
    }

    if (
      result.verdict === "clean" &&
      domainRecord &&
      domainRecord.status === "verified" &&
      indexedDomain &&
      indexedDomain.status === "not_indexed"
    ) {
      return false;
    }

    if (result.verdict !== "clean") {
      return true;
    }

    return indexedDomain && indexedDomain.status === "not_indexed";
  }

  function showNotice(tabId, result) {
    if (!shouldShowNotice(result) || !runtime.tabs || !runtime.tabs.sendMessage) {
      return;
    }

    try {
      var maybePromise = runtime.tabs.sendMessage(tabId, {
        type: "PHISHBUDDY_SHOW_NOTICE",
        result: result
      });
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(function () {});
      }
    } catch (error) {}
  }

  function checkNavigation(tabId, url) {
    if (!isCheckableUrl(url)) {
      return;
    }

    if (allowNextNavigationByTab[tabId] === url) {
      delete allowNextNavigationByTab[tabId];
      return;
    }

    var checkId = tabId + ":" + Date.now();
    pendingChecks[tabId] = checkId;

    global.PhishBuddyConfig.getApiBaseUrl().then(function (apiBaseUrl) {
      return global.PhishBuddyApi.checkUrl(apiBaseUrl, url);
    }).then(function (result) {
      storeResult(result);
      if (pendingChecks[tabId] !== checkId) {
        return;
      }
      if (result.verdict === "dangerous") {
        return updateTab(tabId, makeWarningUrl(result));
      }
      showNotice(tabId, result);
    }).catch(function (error) {
      latestResultsByUrl[url] = {
        verdict: "suspicious",
        url: url,
        reasons: [error.message],
        signals: {},
        checkedAt: Date.now(),
        checkFailed: true
      };
    });
  }

  runtime.webNavigation.onBeforeNavigate.addListener(function (details) {
    if (details.frameId === 0 && typeof details.tabId === "number" && details.tabId >= 0) {
      checkNavigation(details.tabId, details.url);
    }
  });

  runtime.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) {
      return false;
    }

    if (message.type === "PHISHBUDDY_GET_RESULT") {
      sendResponse(latestResultsByUrl[message.url] || null);
      return false;
    }

    if (message.type === "PHISHBUDDY_ALLOW_NEXT" && sender && sender.tab && typeof sender.tab.id === "number") {
      allowNextNavigationByTab[sender.tab.id] = message.url;
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  global.PhishBuddyBackground = {
    shouldShowNotice: shouldShowNotice
  };

  if (typeof module !== "undefined") {
    module.exports = global.PhishBuddyBackground;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);
