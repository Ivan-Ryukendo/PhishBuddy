(function () {
  "use strict";

  var redirects = [];
  var lastHref = location.href;
  var noticeTimer = null;
  var noticeEl = null;

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

  function getNoticeState(result) {
    if (!result || result.verdict === "dangerous") {
      return "dangerous";
    }

    var indexedDomain = result.signals && result.signals.indexedDomain;
    if (result.verdict === "clean" && indexedDomain && indexedDomain.status === "not_indexed") {
      return "notIndexed";
    }

    return result.verdict || "suspicious";
  }

  function getNoticeCopy(result) {
    var state = getNoticeState(result);
    if (state === "dangerous") {
      return {
        title: "Dangerous site",
        message: "PhishBuddy found a serious warning for this site."
      };
    }
    if (state === "notIndexed") {
      return {
        title: "Not listed yet",
        message: "This site is not in the trusted index. Use caution."
      };
    }
    return {
      title: "Caution",
      message: "This site raised warning signs. Review it before interacting."
    };
  }

  function removeNotice() {
    if (noticeTimer !== null) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    if (!noticeEl) {
      return;
    }
    noticeEl.setAttribute("data-closing", "true");
    var element = noticeEl;
    noticeEl = null;
    setTimeout(function () {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 180);
  }

  function showNotice(result) {
    var state = getNoticeState(result);
    if (state === "clean") {
      removeNotice();
      return;
    }

    removeNotice();

    var copy = getNoticeCopy(result);
    var host = document.createElement("div");
    host.id = "phishbuddy-site-notice";
    host.setAttribute("data-state", state);
    host.setAttribute("role", "status");

    var title = document.createElement("strong");
    title.textContent = copy.title;
    host.appendChild(title);

    var message = document.createElement("span");
    message.textContent = copy.message;
    host.appendChild(message);

    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Dismiss PhishBuddy warning");
    dismiss.textContent = "\u00d7";
    dismiss.addEventListener("click", removeNotice);
    host.appendChild(dismiss);

    var style = document.createElement("style");
    style.textContent = [
      "#phishbuddy-site-notice{position:fixed;z-index:2147483647;top:12px;left:50%;max-width:min(520px,calc(100vw - 24px));box-sizing:border-box;display:grid;grid-template-columns:1fr auto;gap:2px 12px;align-items:center;padding:12px 14px;border:1px solid rgba(0,0,0,.22);border-radius:14px;background:#ffd21f;color:#211a00;box-shadow:0 14px 40px rgba(0,0,0,.22);font:500 14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transform:translate(-50%,-120%);opacity:0;animation:phishbuddy-slide-in .18s ease-out forwards}",
      "#phishbuddy-site-notice[data-state='dangerous']{background:#bd1f16;color:#fff;border-color:rgba(255,255,255,.22)}",
      "#phishbuddy-site-notice strong{grid-column:1;font-size:14px;font-weight:800}",
      "#phishbuddy-site-notice span{grid-column:1;font-size:13px;font-weight:500}",
      "#phishbuddy-site-notice button{grid-column:2;grid-row:1/3;appearance:none;border:0;background:rgba(0,0,0,.12);color:inherit;width:28px;height:28px;border-radius:999px;font:700 18px/1 system-ui;cursor:pointer}",
      "#phishbuddy-site-notice[data-closing='true']{animation:phishbuddy-slide-out .18s ease-out forwards}",
      "@keyframes phishbuddy-slide-in{to{transform:translate(-50%,0);opacity:1}}",
      "@keyframes phishbuddy-slide-out{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-120%);opacity:0}}",
      "@media (prefers-reduced-motion:reduce){#phishbuddy-site-notice{animation:none;transform:translate(-50%,0);opacity:1}}"
    ].join("");
    host.appendChild(style);

    document.documentElement.appendChild(host);
    noticeEl = host;
    noticeTimer = setTimeout(removeNotice, 5000);
  }

  setInterval(noteNavigationChange, 750);

  var runtime = window.browser || window.chrome;
  if (!runtime || !runtime.runtime || !runtime.runtime.onMessage) {
    return;
  }

  runtime.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) {
      return false;
    }

    if (message.type === "PHISHBUDDY_COLLECT_PAGE_RISK") {
      noteNavigationChange();
      sendResponse(collectPageRisk());
      return false;
    }

    if (message.type === "PHISHBUDDY_SHOW_NOTICE") {
      showNotice(message.result);
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });
})();
