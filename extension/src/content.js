(function () {
  "use strict";

  var redirects = [];
  var lastHref = location.href;

  function toAbsoluteUrl(value) {
    if (!value) {
      return "";
    }
    try {
      return new URL(value, location.href).href;
    } catch (error) {
      return "";
    }
  }

  function isHiddenElement(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0 ||
      rect.width <= 2 ||
      rect.height <= 2;
  }

  function collectPageRisk() {
    var scripts = Array.from(document.scripts).map(function (script) {
      return {
        src: toAbsoluteUrl(script.getAttribute("src")),
        sample: script.src ? "" : String(script.textContent || "").slice(0, 8000)
      };
    });

    var forms = Array.from(document.forms).map(function (form) {
      return {
        action: toAbsoluteUrl(form.getAttribute("action") || location.href)
      };
    });

    var frames = Array.from(document.querySelectorAll("iframe, frame")).map(function (frame) {
      return {
        src: toAbsoluteUrl(frame.getAttribute("src")),
        hidden: isHiddenElement(frame)
      };
    });

    return {
      url: location.href,
      scripts: scripts,
      forms: forms,
      frames: frames,
      redirects: redirects.slice(-4)
    };
  }

  function noteNavigationChange() {
    if (location.href !== lastHref) {
      redirects.push(location.href);
      lastHref = location.href;
    }
  }

  setInterval(noteNavigationChange, 750);

  var runtime = window.browser || window.chrome;
  if (!runtime || !runtime.runtime || !runtime.runtime.onMessage) {
    return;
  }

  runtime.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== "PHISHBUDDY_COLLECT_PAGE_RISK") {
      return false;
    }

    noteNavigationChange();
    sendResponse(collectPageRisk());
    return false;
  });
})();
