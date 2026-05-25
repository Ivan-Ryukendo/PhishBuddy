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
    PhishBuddyConfig.getApiBaseUrl().then(function (baseUrl) {
      apiInput.value = baseUrl;
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var url = urlInput.value.trim();
    PhishBuddyUi.renderVerdict(resultEl, "loading");
    setBusy(true);

    PhishBuddyConfig.getApiBaseUrl().then(function (apiBaseUrl) {
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
  loadConfig();
})();
