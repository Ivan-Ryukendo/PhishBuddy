(function () {
  "use strict";

  var runtime = window.browser || window.chrome;
  var params = new URLSearchParams(window.location.search);
  var blockedUrl = normalizeBlockedUrl(params.get("url") || "");
  var verdict = normalizeVerdict(params.get("verdict") || "dangerous");
  var urlEl = document.getElementById("blocked-url");
  var resultEl = document.getElementById("warning-result");
  var continueButton = document.getElementById("continue-button");

  urlEl.textContent = blockedUrl;
  PhishBuddyUi.renderVerdict(resultEl, {
    verdict: verdict,
    reasons: []
  });

  if (runtime && runtime.runtime && blockedUrl) {
    runtime.runtime.sendMessage({
      type: "PHISHBUDDY_GET_RESULT",
      url: blockedUrl
    }, function (result) {
      if (result) {
        PhishBuddyUi.renderVerdict(resultEl, result);
      }
    });
  }

  continueButton.addEventListener("click", function () {
    if (blockedUrl) {
      if (runtime && runtime.runtime) {
        var maybePromise = runtime.runtime.sendMessage({
          type: "PHISHBUDDY_ALLOW_NEXT",
          url: blockedUrl
        }, function () {
          window.location.href = blockedUrl;
        });
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(function () {
            window.location.href = blockedUrl;
          }, function () {
            window.location.href = blockedUrl;
          });
        }
      } else {
        window.location.href = blockedUrl;
      }
    }
  });

  function normalizeBlockedUrl(value) {
    try {
      var parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "";
      }
      return parsed.href;
    } catch (error) {
      return "";
    }
  }

  function normalizeVerdict(value) {
    return value === "clean" || value === "suspicious" || value === "dangerous"
      ? value
      : "dangerous";
  }
})();
