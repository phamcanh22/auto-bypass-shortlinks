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

// Quét tự động mọi tham số trên URL xem có chứa chuỗi Base64 của http:// hoặc https:// không
function findEmbeddedUrlInSearchParams(urlObj) {
  // 1. Quét tất cả query parameters (?url=..., ?u=..., ?v=..., ?dest=..., ?go=..., v.v.)
  for (const [, val] of urlObj.searchParams.entries()) {
    if (!val) continue;

    // Trường hợp A: Tham số chứa trực tiếp URL rõ (encoded hoặc raw, ví dụ ?url=https://mega.nz/...)
    if (/^https?:\/\//i.test(val)) {
      return val;
    }

    // Trường hợp B: Tham số chứa Base64 của http:// (aHR0cDovL) hoặc https:// (aHR0cHM6Ly)
    if (/^aHR0c(HM6Ly|DovL)/i.test(val)) {
      const decoded = safeAtob(val);
      if (decoded && /^https?:\/\//i.test(decoded)) {
        return decoded;
      }
    }
  }

  // 2. Quét cả trong phần Hash (#aHR0cHM6Ly...) nếu trang rút gọn giấu sau dấu #
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

function extractTargetFromApiData(data) {
  if (!data || !data[0]) return null;

  if (data[0].destination) {
    const dest = data[0].destination;
    try {
      const destUrl = new URL(dest);
      const embedded = findEmbeddedUrlInSearchParams(destUrl);
      if (embedded) return embedded;
    } catch (_) {}

    if (!dest.includes("anchoreth.com") && /^https?:\/\//i.test(dest)) {
      return dest;
    }
  }

  if (data[0].metadata) {
    try {
      const meta = JSON.parse(data[0].metadata);
      if (meta && meta.url && /^https?:\/\//i.test(meta.url)) return meta.url;
    } catch (_) {}
  }

  return null;
}

async function fetchAdshnkTarget(code) {
  const body = new URLSearchParams({
    req: "init",
    uri: `https://adshnk.com/${code}`,
    cookie_bypass_v1: "false"
  });

  const resp = await fetch("https://www.shrink-service.it/v3/api/prototype/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: body.toString()
  });
  const data = await resp.json();
  return extractTargetFromApiData(data);
}

// Xử lý chuỗi URL rút gọn (có thể lồng nhiều lớp Base64 + AdShrink)
async function resolveAnyShortUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname;

    // Kiểm tra xem có URL/Base64 nhúng trong tham số không (bất kể tên miền là gì)
    const embedded = findEmbeddedUrlInSearchParams(u);
    if (embedded) {
      // Nếu giải mã ra mà lại là một link shrink-service / adshnk lồng bên trong thì giải mã tiếp lớp 2 luôn
      const shrinkMatch = embedded.match(/(?:shrink-service\.it\/btn|adshnk\.com)\/([a-zA-Z0-9_-]+)/);
      if (shrinkMatch && shrinkMatch[1]) {
        const finalTarget = await fetchAdshnkTarget(shrinkMatch[1]);
        return finalTarget || embedded;
      }
      // Nếu giải mã ra vẫn còn lồng 1 lớp Base64 nữa thì đệ quy thêm 1 lần
      try {
        const innerCheck = findEmbeddedUrlInSearchParams(new URL(embedded));
        if (innerCheck) return innerCheck;
      } catch (_) {}

      return embedded;
    }

    // Nếu là shrink-service.it/btn/<CODE>
    if (host.includes("shrink-service.it")) {
      const match = u.pathname.match(/\/btn\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return await fetchAdshnkTarget(match[1]);
      }
    }

    // Nếu là adshnk.com/<CODE>
    if (host.includes("adshnk.com")) {
      const match = u.pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
      if (match && match[1] && !["HTTP404", "recaptcha"].includes(match[1])) {
        return await fetchAdshnkTarget(match[1]);
      }
    }
  } catch (e) {}

  return null;
}

// Bắt ngay lập tức mọi điều hướng ở cấp trình duyệt trước khi server kịp 302 Redirect
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!/^https?:\/\//i.test(details.url)) return;

  resolveAnyShortUrl(details.url).then((targetUrl) => {
    if (targetUrl && targetUrl !== details.url) {
      chrome.tabs.update(details.tabId, { url: targetUrl });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resolveUrl" && request.url) {
    resolveAnyShortUrl(request.url)
      .then((targetUrl) => sendResponse({ success: true, targetUrl }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
