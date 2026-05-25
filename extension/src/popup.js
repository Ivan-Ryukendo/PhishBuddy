(function () {
  "use strict";

  var form = document.getElementById("check-form");
  var urlInput = document.getElementById("url-input");
  var resultEl = document.getElementById("result");
  var manualToggle = document.getElementById("manual-toggle");
  var currentDomain = document.getElementById("current-domain");

  function setBusy(isBusy) {
    var button = form.querySelector("button");
    button.disabled = isBusy;
    manualToggle.disabled = isBusy;
  }

  function getRuntime() {
    return window.browser || window.chrome;
  }

  function isWebUrl(url) {
    try {
      var parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function setCurrentDomain(url) {
    try {
      currentDomain.textContent = new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      currentDomain.textContent = "Current tab";
    }
  }

  function getActiveTab() {
    var runtime = getRuntime();
    if (!runtime || !runtime.tabs || !runtime.tabs.query) {
      return Promise.resolve(null);
    }

    var query = { active: true, currentWindow: true };
    if (window.browser && runtime.tabs.query.length < 2) {
      return runtime.tabs.query(query).then(function (tabs) {
        return tabs && tabs[0] ? tabs[0] : null;
      });
    }

    return new Promise(function (resolve) {
      runtime.tabs.query(query, function (tabs) {
        resolve(tabs && tabs[0] ? tabs[0] : null);
      });
    });
  }

  function collectPageRisk(tabId) {
    var runtime = getRuntime();
    if (!runtime || !runtime.tabs || !runtime.tabs.sendMessage || typeof tabId !== "number") {
      return Promise.resolve(null);
    }

    var message = { type: "PHISHBUDDY_COLLECT_PAGE_RISK" };
    if (window.browser && runtime.tabs.sendMessage.length < 3) {
      return runtime.tabs.sendMessage(tabId, message).catch(function () {
        return null;
      });
    }

    return new Promise(function (resolve) {
      runtime.tabs.sendMessage(tabId, message, function (payload) {
        if (runtime.runtime && runtime.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(payload || null);
      });
    });
  }

  function checkUrl(url, tabId) {
    if (!isWebUrl(url)) {
      PhishBuddyUi.renderVerdict(resultEl, {
        verdict: "error",
        reasons: ["Open an http or https page, then reopen PhishBuddy."]
      });
      return Promise.resolve();
    }

    urlInput.value = url;
    setCurrentDomain(url);
    PhishBuddyUi.renderVerdict(resultEl, "loading");
    setBusy(true);

    return Promise.all([
      PhishBuddyConfig.getApiBaseUrl().then(function (apiBaseUrl) {
        return PhishBuddyApi.checkUrl(apiBaseUrl, url);
      }),
      collectPageRisk(tabId).then(function (payload) {
        return payload ? PhishBuddyPageRisk.summarizePageRisk(payload) : null;
      })
    ]).then(function (parts) {
      var result = PhishBuddyPageRisk.mergeResultWithPageRisk(parts[0], parts[1]);
      PhishBuddyUi.renderVerdict(resultEl, result);
    }).catch(function (error) {
      PhishBuddyUi.renderVerdict(resultEl, {
        verdict: "error",
        reasons: [error.message]
      });
    }).then(function () {
      setBusy(false);
    });
  }

  function checkActiveTab() {
    return getActiveTab().then(function (tab) {
      if (!tab || !tab.url) {
        return;
      }
      return checkUrl(tab.url, tab.id);
    });
  }

  manualToggle.addEventListener("click", function () {
    form.hidden = !form.hidden;
    if (!form.hidden) {
      urlInput.focus();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    checkUrl(urlInput.value.trim(), null);
  });

  PhishBuddyUi.renderVerdict(resultEl, "idle");
  checkActiveTab();
})();
