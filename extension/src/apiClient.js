(function (global) {
  "use strict";

  var VALID_VERDICTS = {
    clean: true,
    suspicious: true,
    dangerous: true
  };

  function normalizeCheckResponse(payload, checkedUrl) {
    var verdict = payload && VALID_VERDICTS[payload.verdict] ? payload.verdict : "suspicious";
    return {
      verdict: verdict,
      url: String((payload && payload.url) || checkedUrl || ""),
      reasons: Array.isArray(payload && payload.reasons) ? payload.reasons.map(String) : [],
      signals: payload && payload.signals && typeof payload.signals === "object" ? payload.signals : {}
    };
  }

  function checkUrl(apiBaseUrl, url, fetchImpl) {
    var baseUrl = (global.PhishBuddyConfig && global.PhishBuddyConfig.normalizeApiBaseUrl(apiBaseUrl)) || String(apiBaseUrl || "").replace(/\/+$/, "");
    var targetUrl = String(url || "").trim();
    var fetcher = fetchImpl || global.fetch;

    if (!baseUrl) {
      return Promise.reject(new Error("API base URL is not configured."));
    }
    if (!targetUrl) {
      return Promise.reject(new Error("URL is required."));
    }
    if (!fetcher) {
      return Promise.reject(new Error("Fetch is not available."));
    }

    return fetcher(baseUrl + "/check-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: targetUrl })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("PhishBuddy check failed with HTTP " + response.status + ".");
      }
      return response.json();
    }).then(function (payload) {
      return normalizeCheckResponse(payload, targetUrl);
    });
  }

  global.PhishBuddyApi = {
    checkUrl: checkUrl,
    normalizeCheckResponse: normalizeCheckResponse
  };

  if (typeof module !== "undefined") {
    module.exports = global.PhishBuddyApi;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
