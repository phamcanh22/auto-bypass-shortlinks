# 🚀 Auto Bypass Shortlinks (Universal Base64 & AdShrink Bypasser)

![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)
![Browser Support](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Opera-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

A lightweight **Manifest V3 Browser Extension** that automatically decodes and redirects shortened links directly to the final destination download URLs (MediaFire, Mega, GoFile, Pixeldrain, Yandex Disk, VexFile, etc.)—completely skipping countdown timers and intermediate ad-blog pages.

---

## ✨ Key Features

- ⚡ **Pre-Navigation Interception (`onBeforeNavigate`):** Intercepts and decodes shortlink URLs before the shortening server can issue an `HTTP 302 Redirect` to intermediate ad-blogs (such as `tech8s.net`).
- 🔍 **Universal Base64 URL Scanner:** Automatically detects and decodes any Base64-encoded `http://` or `https://` payload (`aHR0cHM6Ly...` / `aHR0cDovL...`) embedded in any query parameter (`?url=`, `?u=`, `?v=`, `?_r=`, `?dest=`, `?go=`, or `#hash`), regardless of future domain changes.
- 🔗 **Multi-Layer Unwrapping:** Seamlessly unwraps nested multi-stage shortlinks (e.g., `network-loop.com` ➡️ `shrink-service.it` ➡️ `adshnk.com` ➡️ `anchoreth.com` ➡️ Final Download Link).
- 🛡️ **CORS-Free Background API Resolution:** Uses a Manifest V3 Background Service Worker to query the `shrink-service.it` / `adshnk.com` prototype API directly and extract the target `destination` / `metadata.url` in under a second.
- 🖱️ **On-Click Link Rewriting:** Automatically rewrites `<a>` anchor tags containing Base64 safelinks to their clean target URLs the moment you click them on any webpage.

---

## 🌐 Supported Shorteners & Safelinks

1. **`1shortlink.com`** (`full-pages?api_key=...&url=BASE64`)
2. **`network-loop.com`** (`.safe/redirect.html?u=BASE64`)
3. **`shrink-service.it`** (`/btn/<CODE>`) & **`adshnk.com`** (`/<CODE>`)
4. **`anchoreth.com`** (`/r-adsh?t=i&v=BASE64`)
5. **All Full-Page Script / SafeLink redirectors** that pass raw or Base64-encoded target URLs in query parameters or URL hashes.

---

## 📦 Installation (Developer Mode / Unpacked)

1. Clone this repository or download and extract the `.zip` archive:
   ```bash
   git clone https://github.com/<username>/shortlink-bypasser-ext.git
   ```
2. Open your Chromium-based browser and navigate to the Extensions management page:
   - **Chrome:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
   - **Brave:** `brave://extensions/`
   - **Opera:** `opera://extensions/`
3. Toggle on **Developer mode** in the top-right (or left) corner.
4. Click **Load unpacked**.
5. Select the `shortlink-bypasser-ext` folder.

> 💡 **Tip:** To use the extension in Incognito / InPrivate windows, click **Details** on the extension card and enable **Allow in Incognito**.

---

## 🛠️ Project Structure

```text
shortlink-bypasser-ext/
├── manifest.json   # Manifest V3 extension configuration
├── background.js   # Service Worker for onBeforeNavigate interception, Base64 decoding & API resolution
├── content.js      # Early document_start blocker & on-click anchor href rewriter
└── README.md       # Project documentation
```

---

## ⚙️ How It Works

1. **Layer 1 (DOM Click Rewriting):** When you click an `<a>` element on any page, `content.js` inspects its `href` for embedded Base64 URLs and replaces the link directly in the DOM before navigation starts.
2. **Layer 2 (Pre-Navigation Hook):** As soon as a tab begins navigating to a shortlink URL, `background.js` catches the request via `chrome.webNavigation.onBeforeNavigate`—beating server-side `302 Found` redirects.
3. **Layer 3 (Direct API Extraction):** For AdShrink links (`shrink-service.it` / `adshnk.com`), the Service Worker sends a direct `POST` request to `/v3/api/prototype/init`, extracts the clean download URL from the JSON response (`destination` or `metadata.url`), and immediately updates the tab via `chrome.tabs.update`.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Intended for educational purposes and personal convenience.
