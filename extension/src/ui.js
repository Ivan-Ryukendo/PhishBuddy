(function (global) {
  "use strict";

  var COPY = {
    clean: {
      title: "Secure",
      pill: "Secure",
      icon: "check",
      message: "This site passed the configured safety checks."
    },
    suspicious: {
      title: "Caution",
      pill: "Caution",
      icon: "caution",
      message: "This site raised warning signs. Review the evidence before interacting."
    },
    dangerous: {
      title: "Dangerous",
      pill: "Dangerous",
      icon: "cross",
      message: "This site appears risky based on our checks. Avoid interacting with it."
    },
    notIndexed: {
      title: "Not indexed",
      pill: "Not indexed",
      icon: "empty",
      message: "This domain is not in the trusted index yet. Treat it with caution."
    },
    idle: {
      title: "Search",
      pill: "Search",
      icon: "search",
      message: "Open a site or search a link to check it with PhishBuddy."
    },
    error: {
      title: "Check failed",
      pill: "Retry",
      icon: "caution",
      message: "The URL could not be checked. Try again in a moment."
    },
    loading: {
      title: "Searching",
      pill: "Searching",
      icon: "search",
      message: "PhishBuddy is checking the site now."
    }
  };

  // Exact Iconify glyphs from the Figma design (each keeps its own viewBox).
  var ICONS = {
    // material-symbols:check-rounded
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m9.55 15.15l8.475-8.475q.3-.3.7-.3t.7.3t.3.713t-.3.712l-9.175 9.2q-.3.3-.7.3t-.7-.3L4.55 13q-.3-.3-.288-.712t.313-.713t.713-.3t.712.3z"/></svg>',
    // mdi:check-all
    checkAll: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M.41 13.41L6 19l1.41-1.42L1.83 12m20.41-6.42L11.66 16.17L7.5 12l-1.43 1.41L11.66 19l12-12M18 7l-1.41-1.42l-6.35 6.35l1.42 1.41z"/></svg>',
    // icon-park-outline:caution
    caution: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4"><path stroke-linejoin="round" d="M24 5L2 43h44z" clip-rule="evenodd"/><path stroke-linecap="round" d="M24 35v1m0-17l.008 10"/></g></svg>',
    // ph:empty
    empty: '<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="m198.24 62.63l15.68-17.25a8 8 0 0 0-11.84-10.76L186.4 51.86A95.95 95.95 0 0 0 57.76 193.37l-15.68 17.25a8 8 0 1 0 11.84 10.76l15.68-17.24A95.95 95.95 0 0 0 198.24 62.63M48 128a80 80 0 0 1 127.6-64.25l-107 117.73A79.63 79.63 0 0 1 48 128m80 80a79.55 79.55 0 0 1-47.6-15.75l107-117.73A79.95 79.95 0 0 1 128 208"/></svg>',
    // material-symbols:close-rounded
    cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"/></svg>',
    // material-symbols:search-rounded
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.6 5.6q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-5.6-5.6q-.75.6-1.725.95T9.5 16m0-2q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"/></svg>',
    // material-symbols:shield-outline-rounded
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.675 21.875q-.15-.025-.3-.075Q8 20.675 6 17.637T4 11.1V6.375q0-.625.363-1.125t.937-.725l6-2.25q.35-.125.7-.125t.7.125l6 2.25q.575.225.938.725T20 6.375V11.1q0 3.5-2 6.538T12.625 21.8q-.15.05-.3.075T12 21.9t-.325-.025M12 19.9q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3"/></svg>',
    // mingcute:time-line
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 2a1 1 0 0 1 .993.883L13 7v4.586l2.707 2.707a1 1 0 0 1-1.32 1.497l-.094-.083l-3-3a1 1 0 0 1-.284-.576L11 12V7a1 1 0 0 1 1-1"/></svg>'
  };

  function iconSvg(name) {
    return ICONS[name] || ICONS.shield;
  }

  function getDisplayState(resultOrState) {
    if (typeof resultOrState === "string") {
      return resultOrState;
    }

    var verdict = resultOrState && resultOrState.verdict;
    var indexedDomain = resultOrState &&
      resultOrState.signals &&
      resultOrState.signals.indexedDomain;
    var domainRecord = resultOrState &&
      resultOrState.signals &&
      resultOrState.signals.domainRecord;

    if (
      verdict === "clean" &&
      domainRecord &&
      domainRecord.status === "verified" &&
      indexedDomain &&
      indexedDomain.status === "not_indexed"
    ) {
      return "clean";
    }

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
      var notIndexed = text.indexOf("not") >= 0 || text.indexOf("has not") >= 0;
      return {
        title: notIndexed ? "Not in index" : "Trusted index",
        detail: text,
        icon: notIndexed ? "caution" : "checkAll"
      };
    }
    if (text.indexOf("Safe Browsing") >= 0 || text.indexOf("threat") >= 0) {
      return {
        title: "Safe Browsing",
        detail: text,
        icon: "shield"
      };
    }
    if (text.indexOf("VirusTotal") >= 0 || text.indexOf("provider") >= 0) {
      return {
        title: "Threat intel",
        detail: text,
        icon: "caution"
      };
    }
    if (text.indexOf("script") >= 0 || text.indexOf("iframe") >= 0 || text.indexOf("form") >= 0 || text.indexOf("redirect") >= 0) {
      return {
        title: "Page behavior",
        detail: text,
        icon: "shield"
      };
    }
    if (text.indexOf("Similar") >= 0 || text.indexOf("similar") >= 0 || text.indexOf("typosquat") >= 0) {
      return {
        title: "Similarity",
        detail: text,
        icon: "search"
      };
    }
    if (text.indexOf("domain") >= 0 || text.indexOf("brand") >= 0) {
      return {
        title: "Domain similarity",
        detail: text,
        icon: "caution"
      };
    }
    return {
      title: "Safety signal",
      detail: text,
      icon: "shield"
    };
  }

  function makeRow(iconName, titleText, detailText) {
    var row = document.createElement("div");
    row.className = "evidence-row";

    var icon = document.createElement("span");
    icon.className = "evidence-icon";
    icon.innerHTML = iconSvg(iconName);
    row.appendChild(icon);

    var copy = document.createElement("div");
    copy.className = "evidence-copy";

    var title = document.createElement("p");
    title.className = "evidence-title";
    title.textContent = titleText;
    copy.appendChild(title);

    var detail = document.createElement("p");
    detail.className = "evidence-detail";
    detail.textContent = detailText;
    copy.appendChild(detail);

    row.appendChild(copy);
    return row;
  }

  function getCurrentDomain() {
    var el = global.document && global.document.getElementById("current-domain");
    var value = el ? String(el.textContent || "").trim() : "";
    return value && value !== "Current tab" && value !== "Checking current tab" ? value : "";
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

    var hero = document.createElement("div");
    hero.className = "hero";

    var badge = document.createElement("span");
    badge.className = "hero-icon";
    badge.innerHTML = iconSvg(display.icon);
    hero.appendChild(badge);

    var title = document.createElement("h2");
    title.className = "verdict-title";
    title.textContent = display.title;
    hero.appendChild(title);

    var domain = getCurrentDomain();
    if (domain && state !== "idle" && state !== "loading") {
      var pill = document.createElement("div");
      pill.className = "domain-pill";
      pill.textContent = domain;
      hero.appendChild(pill);
    }

    var message = document.createElement("p");
    message.className = "verdict-message";
    message.textContent = display.message;
    hero.appendChild(message);

    container.appendChild(hero);

    if (state !== "idle" && state !== "loading" && state !== "error") {
      var card = document.createElement("section");
      card.className = "evidence";

      if (reasons.length) {
        reasons.slice(0, 5).forEach(function (reason) {
          var summary = summarizeReason(reason);
          card.appendChild(makeRow(summary.icon, summary.title, summary.detail));
        });
      } else {
        card.appendChild(makeRow("shield", "Safety signal", "No known safety warnings were found."));
      }

      card.appendChild(makeRow("clock", "Checked on", new Date().toLocaleString()));
      container.appendChild(card);
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
