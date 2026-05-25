(function (global) {
  "use strict";

  var COPY = {
    clean: {
      title: "\u2713 Secure",
      message: "This indexed domain passed the configured safety checks."
    },
    suspicious: {
      title: "! Unsure",
      message: "PhishBuddy found warning signs or does not have enough confidence yet."
    },
    dangerous: {
      title: "\u2715 Unsafe",
      message: "PhishBuddy found high-risk phishing signals for this URL."
    },
    notIndexed: {
      title: "! Not indexed yet",
      message: "This domain is not in the trusted-domain index yet. Treat it as unsure."
    },
    idle: {
      title: "Check a URL",
      message: "Current tab"
    },
    error: {
      title: "Check failed",
      message: "The URL could not be checked. Verify the API URL and try again."
    },
    loading: {
      title: "Checking",
      message: "PhishBuddy is checking this URL."
    }
  };

  function getDisplayState(resultOrState) {
    if (typeof resultOrState === "string") {
      return resultOrState;
    }

    var verdict = resultOrState && resultOrState.verdict;
    var indexedDomain = resultOrState &&
      resultOrState.signals &&
      resultOrState.signals.indexedDomain;

    if (verdict === "clean" && indexedDomain && indexedDomain.status === "not_indexed") {
      return "notIndexed";
    }

    return verdict || "idle";
  }

  function getVerdictDisplay(verdict) {
    return COPY[verdict] || COPY.suspicious;
  }

  function renderVerdict(container, resultOrState) {
    var state = getDisplayState(resultOrState);
    var display = getVerdictDisplay(state || "idle");
    var reasons = resultOrState && Array.isArray(resultOrState.reasons) ? resultOrState.reasons : [];

    container.className = "verdict verdict-" + (state || "idle");
    container.innerHTML = "";

    var title = document.createElement("strong");
    title.textContent = display.title;
    container.appendChild(title);

    var message = document.createElement("p");
    message.textContent = display.message;
    container.appendChild(message);

    if (reasons.length) {
      var list = document.createElement("ul");
      reasons.forEach(function (reason) {
        var item = document.createElement("li");
        item.textContent = reason;
        list.appendChild(item);
      });
      container.appendChild(list);
    }
  }

  global.PhishBuddyUi = {
    getDisplayState: getDisplayState,
    getVerdictDisplay: getVerdictDisplay,
    renderVerdict: renderVerdict
  };

  if (typeof module !== "undefined") {
    module.exports = {
      getDisplayState: getDisplayState,
      getVerdictDisplay: getVerdictDisplay
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
