(function () {
  "use strict";

  var form = document.getElementById("check-form");
  var urlInput = document.getElementById("url-input");
  var resultEl = document.getElementById("result");
  var apiForm = document.getElementById("api-form");
  var apiInput = document.getElementById("api-base-url");
  var saveStatus = document.getElementById("save-status");

  function setBusy(isBusy) {
    form.querySelector("button").disabled = isBusy;
  }

  function loadConfig() {
    return PhishBuddyConfig.getApiBaseUrl().then(function (baseUrl) {
      apiInput.value = baseUrl;
      return baseUrl;
    });
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

  function getActiveTabUrl() {
    var runtime = getRuntime();
    if (!runtime || !runtime.tabs || !runtime.tabs.query) {
      return Promise.resolve("");
    }

    var query = { active: true, currentWindow: true };
    if (window.browser && runtime.tabs.query.length < 2) {
      return runtime.tabs.query(query).then(function (tabs) {
        return tabs && tabs[0] && tabs[0].url ? tabs[0].url : "";
      });
    }

    return new Promise(function (resolve) {
      runtime.tabs.query(query, function (tabs) {
        resolve(tabs && tabs[0] && tabs[0].url ? tabs[0].url : "");
      });
    });
  }

  function checkUrl(url) {
    if (!isWebUrl(url)) {
      PhishBuddyUi.renderVerdict(resultEl, {
        verdict: "error",
        reasons: ["Open an http or https page, then reopen PhishBuddy."]
      });
      return Promise.resolve();
    }

    urlInput.value = url;
    PhishBuddyUi.renderVerdict(resultEl, "loading");
    setBusy(true);

    return PhishBuddyConfig.getApiBaseUrl().then(function (apiBaseUrl) {
      return PhishBuddyApi.checkUrl(apiBaseUrl, url);
    }).then(function (result) {
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
    return getActiveTabUrl().then(function (url) {
      if (!url) {
        return;
      }
      urlInput.value = url;
      return checkUrl(url);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    checkUrl(urlInput.value.trim());
  });

  apiForm.addEventListener("submit", function (event) {
    event.preventDefault();
    PhishBuddyConfig.setApiBaseUrl(apiInput.value).then(function (baseUrl) {
      apiInput.value = baseUrl;
      saveStatus.textContent = "Saved";
      setTimeout(function () {
        saveStatus.textContent = "";
      }, 1600);
    });
  });

  PhishBuddyUi.renderVerdict(resultEl, "idle");
  loadConfig().then(checkActiveTab);
})();
