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

    var domainRecord = result.signals && result.signals.domainRecord;
    var indexedDomain = result.signals && result.signals.indexedDomain;
    if (
      result.verdict === "clean" &&
      domainRecord &&
      domainRecord.status === "verified" &&
      indexedDomain &&
      indexedDomain.status === "not_indexed"
    ) {
      return "clean";
    }

    if (result.verdict === "clean" && indexedDomain && indexedDomain.status === "not_indexed") {
      return "notIndexed";
    }

    return result.verdict || "suspicious";
  }

  var NOTICE_ICONS = {
    notIndexed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M7 17 17 7"/></svg>',
    suspicious: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 19h18L12 4z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
    dangerous: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8 8 16"/></svg>'
  };

  function getNoticeCopy(result) {
    var state = getNoticeState(result);
    if (state === "dangerous") {
      return {
        title: "Danger",
        message: "This site appears risky. Avoid interaction.",
        icon: NOTICE_ICONS.dangerous
      };
    }
    if (state === "notIndexed") {
      return {
        title: "Not listed yet",
        message: "This site is not in the index. Use caution.",
        icon: NOTICE_ICONS.notIndexed
      };
    }
    return {
      title: "Warning",
      message: "This site raised warning signs. Review now.",
      icon: NOTICE_ICONS.suspicious
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

    var icon = document.createElement("span");
    icon.className = "pb-notice-icon";
    icon.innerHTML = copy.icon;
    host.appendChild(icon);

    var text = document.createElement("span");
    text.className = "pb-notice-text";

    var title = document.createElement("strong");
    title.textContent = copy.title;
    text.appendChild(title);

    var message = document.createElement("span");
    message.textContent = copy.message;
    text.appendChild(message);

    host.appendChild(text);

    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Dismiss PhishBuddy warning");
    dismiss.textContent = "\u00d7";
    dismiss.addEventListener("click", removeNotice);
    host.appendChild(dismiss);

    var style = document.createElement("style");
    style.textContent = [
      "#phishbuddy-site-notice{position:fixed;z-index:2147483647;top:16px;left:50%;width:336px;max-width:calc(100vw - 24px);box-sizing:border-box;display:grid;grid-template-columns:30px minmax(0,1fr) 20px;column-gap:12px;align-items:center;padding:12px;border-radius:10px;background:#ffd21f;color:#211a00;box-shadow:0 14px 40px rgba(0,0,0,.22);font:400 13px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transform:translate(-50%,-130%);opacity:0;animation:phishbuddy-slide-in .18s ease-out forwards}",
      "#phishbuddy-site-notice[data-state='suspicious']{background:#ed9b16;color:#fff}",
      "#phishbuddy-site-notice[data-state='dangerous']{background:#ed1c24;color:#fff}",
      "#phishbuddy-site-notice .pb-notice-icon{display:grid;place-items:center;width:30px;height:30px;color:inherit}",
      "#phishbuddy-site-notice .pb-notice-icon svg{width:28px;height:28px;display:block}",
      "#phishbuddy-site-notice .pb-notice-text{min-width:0;display:flex;flex-direction:column;gap:4px}",
      "#phishbuddy-site-notice strong{font-size:14px;font-weight:700;line-height:1.2}",
      "#phishbuddy-site-notice .pb-notice-text span{font-size:13px;font-weight:400;line-height:1.2;opacity:.92;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#phishbuddy-site-notice button{appearance:none;border:0;background:transparent;color:inherit;opacity:.7;width:20px;height:20px;padding:0;border-radius:999px;font:400 18px/1 system-ui;cursor:pointer}",
      "#phishbuddy-site-notice button:hover{opacity:1}",
      "#phishbuddy-site-notice[data-closing='true']{animation:phishbuddy-slide-out .18s ease-out forwards}",
      "@keyframes phishbuddy-slide-in{to{transform:translate(-50%,0);opacity:1}}",
      "@keyframes phishbuddy-slide-out{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-130%);opacity:0}}",
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
    exportForTests();
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

  exportForTests();

  function exportForTests() {
    window.PhishBuddyContent = {
      getNoticeState: getNoticeState
    };
    if (typeof module !== "undefined") {
      module.exports = window.PhishBuddyContent;
    }
  }
})();
