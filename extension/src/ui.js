(function (global) {
  "use strict";

  var COPY = {
    clean: {
      title: "Secure",
      pill: "Secure",
      icon: "\u2713",
      message: "This site passed the configured safety checks."
    },
    suspicious: {
      title: "Caution",
      pill: "Caution",
      icon: "!",
      message: "This site raised warning signs. Review the evidence before interacting."
    },
    dangerous: {
      title: "Dangerous",
      pill: "Dangerous",
      icon: "\u00d7",
      message: "This site appears risky based on our checks. Avoid interacting with it."
    },
    notIndexed: {
      title: "Caution",
      pill: "Not indexed",
      icon: "!",
      message: "This domain is not in the trusted index yet. Treat it with caution."
    },
    idle: {
      title: "Ready",
      pill: "Ready",
      icon: "\u2315",
      message: "Open a site or search a link to check it with PhishBuddy."
    },
    error: {
      title: "Check failed",
      pill: "Retry",
      icon: "!",
      message: "The URL could not be checked. Try again in a moment."
    },
    loading: {
      title: "Searching",
      pill: "Searching",
      icon: "\u2315",
      message: "PhishBuddy is checking the site now."
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

  function summarizeReason(reason) {
    var text = String(reason || "");
    if (text.indexOf("trusted-domain list") >= 0 || text.indexOf("trusted index") >= 0) {
      return {
        title: text.indexOf("not") >= 0 || text.indexOf("has not") >= 0 ? "Domain not in trusted index" : "Domain in trusted index",
        detail: text,
        icon: "i"
      };
    }
    if (text.indexOf("Safe Browsing") >= 0 || text.indexOf("threat") >= 0) {
      return {
        title: "Safe Browsing",
        detail: text,
        icon: "s"
      };
    }
    if (text.indexOf("VirusTotal") >= 0 || text.indexOf("provider") >= 0) {
      return {
        title: "Threat intelligence",
        detail: text,
        icon: "v"
      };
    }
    if (text.indexOf("script") >= 0 || text.indexOf("iframe") >= 0 || text.indexOf("form") >= 0 || text.indexOf("redirect") >= 0) {
      return {
        title: "Page behavior",
        detail: text,
        icon: "!"
      };
    }
    if (text.indexOf("domain") >= 0 || text.indexOf("brand") >= 0) {
      return {
        title: "Domain similarity",
        detail: text,
        icon: "d"
      };
    }
    return {
      title: "Safety signal",
      detail: text,
      icon: "i"
    };
  }

  function addEvidenceRow(list, reason, state) {
    var summary = summarizeReason(reason);
    var row = document.createElement("div");
    row.className = "evidence-row";

    var icon = document.createElement("span");
    icon.className = "evidence-icon";
    icon.textContent = summary.icon;
    row.appendChild(icon);

    var copy = document.createElement("div");
    copy.className = "evidence-copy";

    var title = document.createElement("p");
    title.className = "evidence-title";
    title.textContent = summary.title;
    copy.appendChild(title);

    var detail = document.createElement("p");
    detail.className = "evidence-detail";
    detail.textContent = summary.detail;
    copy.appendChild(detail);

    row.appendChild(copy);

    var mark = document.createElement("span");
    mark.className = "evidence-mark";
    mark.textContent = state === "dangerous" ? "\u00d7" : state === "clean" ? "\u2713" : "!";
    row.appendChild(mark);

    list.appendChild(row);
  }

  function addCheckedRow(list, state) {
    var row = document.createElement("div");
    row.className = "evidence-row";

    var icon = document.createElement("span");
    icon.className = "evidence-icon";
    icon.textContent = "\u25cc";
    row.appendChild(icon);

    var copy = document.createElement("div");
    copy.className = "evidence-copy";

    var title = document.createElement("p");
    title.className = "evidence-title";
    title.textContent = "Checked on";
    copy.appendChild(title);

    var detail = document.createElement("p");
    detail.className = "evidence-detail";
    detail.textContent = new Date().toLocaleString();
    copy.appendChild(detail);

    row.appendChild(copy);

    var mark = document.createElement("span");
    mark.className = "evidence-mark";
    mark.textContent = state === "dangerous" ? "\u00d7" : state === "clean" ? "\u2713" : "!";
    row.appendChild(mark);

    list.appendChild(row);
  }

  function renderVerdict(container, resultOrState) {
    var state = getDisplayState(resultOrState);
    var display = getVerdictDisplay(state || "idle");
    var reasons = resultOrState && Array.isArray(resultOrState.reasons) ? resultOrState.reasons : [];

    if (global.document && global.document.body) {
      global.document.body.setAttribute("data-state", state || "idle");
    }

    container.className = "verdict verdict-" + (state || "idle");
    container.innerHTML = "";

    var pill = document.createElement("div");
    pill.className = "status-pill";
    pill.textContent = display.pill + " " + display.icon;
    container.appendChild(pill);

    var title = document.createElement("h2");
    title.className = "verdict-title";
    title.textContent = display.title;
    container.appendChild(title);

    var message = document.createElement("p");
    message.className = "verdict-message";
    message.textContent = display.message;
    container.appendChild(message);

    if (state !== "idle" && state !== "loading") {
      var evidence = document.createElement("section");
      evidence.className = "evidence";

      var evidenceTitle = document.createElement("h3");
      evidenceTitle.className = "evidence-heading";
      evidenceTitle.textContent = "Evidence";
      evidence.appendChild(evidenceTitle);

      if (reasons.length) {
        reasons.slice(0, 5).forEach(function (reason) {
          addEvidenceRow(evidence, reason, state);
        });
      } else {
        addEvidenceRow(evidence, "No known safety warnings were found.", state);
      }

      addCheckedRow(evidence, state);
      container.appendChild(evidence);
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
