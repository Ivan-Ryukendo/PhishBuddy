(function (global) {
  "use strict";

  var COPY = {
    clean: {
      title: "Clean",
      message: "No phishing signals were reported for this URL."
    },
    suspicious: {
      title: "Suspicious",
      message: "PhishBuddy found warning signs. Review the URL before continuing."
    },
    dangerous: {
      title: "Dangerous",
      message: "PhishBuddy found high-risk phishing signals for this URL."
    },
    idle: {
      title: "Check a URL",
      message: "Paste a URL to check it with PhishBuddy."
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

  function getVerdictDisplay(verdict) {
    return COPY[verdict] || COPY.suspicious;
  }

  function renderVerdict(container, resultOrState) {
    var state = typeof resultOrState === "string" ? resultOrState : resultOrState && resultOrState.verdict;
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
    getVerdictDisplay: getVerdictDisplay,
    renderVerdict: renderVerdict
  };

  if (typeof module !== "undefined") {
    module.exports = {
      getVerdictDisplay: getVerdictDisplay
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
