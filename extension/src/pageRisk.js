(function (global) {
  "use strict";

  var MAX_SCRIPT_REASON_COUNT = 3;

  function getHostname(value) {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function sameRegisteredHost(left, right) {
    var leftParts = getHostname(left).split(".").slice(-2).join(".");
    var rightParts = getHostname(right).split(".").slice(-2).join(".");
    return leftParts !== "" && leftParts === rightParts;
  }

  function hasSuspiciousText(text) {
    var source = String(text || "");
    if (source.length > 6000 && /eval\s*\(|Function\s*\(|atob\s*\(|fromCharCode|unescape\s*\(/.test(source)) {
      return true;
    }
    return /(eval\s*\(|document\.write\s*\(|atob\s*\(|fromCharCode|\\x[0-9a-f]{2})/i.test(source);
  }

  function summarizePageRisk(payload) {
    var reasons = [];
    var pageUrl = payload && payload.url ? String(payload.url) : "";
    var scripts = Array.isArray(payload && payload.scripts) ? payload.scripts : [];
    var forms = Array.isArray(payload && payload.forms) ? payload.forms : [];
    var frames = Array.isArray(payload && payload.frames) ? payload.frames : [];
    var redirects = Array.isArray(payload && payload.redirects) ? payload.redirects : [];

    var externalScripts = scripts.filter(function (script) {
      return script.src && !sameRegisteredHost(pageUrl, script.src);
    });
    if (externalScripts.length >= 12) {
      reasons.push("Page loads many scripts from outside domains.");
    }

    var suspiciousScripts = scripts.filter(function (script) {
      return hasSuspiciousText(script.sample);
    }).slice(0, MAX_SCRIPT_REASON_COUNT);
    suspiciousScripts.forEach(function () {
      reasons.push("Page contains heavily obfuscated or dynamic script patterns.");
    });

    forms.forEach(function (form) {
      if (form.action && !sameRegisteredHost(pageUrl, form.action)) {
        reasons.push("A form sends data to a different domain.");
      }
    });

    frames.forEach(function (frame) {
      if (frame.hidden && frame.src && !sameRegisteredHost(pageUrl, frame.src)) {
        reasons.push("Hidden embedded content points to another domain.");
      }
    });

    redirects.forEach(function (redirect) {
      if (redirect && !sameRegisteredHost(pageUrl, redirect)) {
        reasons.push("The tab appears to have redirected across domains.");
      }
    });

    return {
      status: reasons.length > 0 ? "suspicious" : "clean",
      reasons: Array.from(new Set(reasons))
    };
  }

  function isIndexedTrustedResult(result) {
    return result &&
      result.verdict === "clean" &&
      result.signals &&
      result.signals.indexedDomain &&
      result.signals.indexedDomain.status === "indexed";
  }

  function mergeResultWithPageRisk(result, pageRisk) {
    if (!pageRisk || !Array.isArray(pageRisk.reasons) || pageRisk.reasons.length === 0) {
      return result;
    }

    if (isIndexedTrustedResult(result)) {
      return {
        verdict: result.verdict,
        url: result.url,
        reasons: result.reasons || [],
        signals: Object.assign({}, result.signals || {}, {
          pageRisk: Object.assign({}, pageRisk, {
            suppressed: true,
            suppressionReason: "Indexed trusted domains are not downgraded by lightweight page-risk heuristics."
          })
        })
      };
    }

    var next = {
      verdict: result.verdict === "dangerous" ? "dangerous" : "suspicious",
      url: result.url,
      reasons: (result.reasons || []).concat(pageRisk.reasons),
      signals: Object.assign({}, result.signals || {}, { pageRisk: pageRisk })
    };

    return next;
  }

  global.PhishBuddyPageRisk = {
    mergeResultWithPageRisk: mergeResultWithPageRisk,
    summarizePageRisk: summarizePageRisk
  };

  if (typeof module !== "undefined") {
    module.exports = global.PhishBuddyPageRisk;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
