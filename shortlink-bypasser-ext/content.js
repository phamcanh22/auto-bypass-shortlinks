(function () {
  "use strict";

  function safeAtob(b64) {
    try {
      let normalized = decodeURIComponent(b64).trim().replace(/-/g, "+").replace(/_/g, "/");
      while (normalized.length % 4 !== 0) {
        normalized += "=";
      }
      return atob(normalized);
    } catch (e) {
      return null;
    }
  }

  function findEmbeddedBase64Url(urlObj) {
    for (const [, val] of urlObj.searchParams.entries()) {
      if (val && /^aHR0c(HM6Ly|DovL)/i.test(val)) {
        const decoded = safeAtob(val);
        if (decoded && /^https?:\/\//i.test(decoded)) {
          return decoded;
        }
      }
    }
    if (urlObj.hash && urlObj.hash.length > 10) {
      const hashVal = urlObj.hash.substring(1);
      if (/^aHR0c(HM6Ly|DovL)/i.test(hashVal)) {
        const decoded = safeAtob(hashVal);
        if (decoded && /^https?:\/\//i.test(decoded)) {
          return decoded;
        }
      }
    }
    return null;
  }

  // Tự động thay thế link rút gọn có chứa Base64 ngay khi người dùng rê chuột hoặc click vào thẻ <a> trên bất kỳ web nào
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || !a.href) return;

      try {
        const u = new URL(a.href);
        const decoded = findEmbeddedBase64Url(u);
        if (decoded && !decoded.includes("shrink-service.it") && !decoded.includes("adshnk.com")) {
          a.href = decoded;
        }
      } catch (_) {}
    },
    true
  );

  // Kiểm tra URL hiện tại
  try {
    const currentUrl = new URL(window.location.href);
    const hasBase64 = findEmbeddedBase64Url(currentUrl);
    const isAdShrink =
      currentUrl.hostname.includes("shrink-service.it") ||
      currentUrl.hostname.includes("adshnk.com");

    if (hasBase64 || isAdShrink) {
      window.stop();
      chrome.runtime.sendMessage({ action: "resolveUrl", url: window.location.href }, (resp) => {
        if (resp && resp.success && resp.targetUrl && resp.targetUrl !== window.location.href) {
          window.location.replace(resp.targetUrl);
        }
      });
    }
  } catch (_) {}
})();
