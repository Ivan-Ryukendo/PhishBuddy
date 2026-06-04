# PhishBuddy — Source & Build Instructions (for Mozilla Add-on Reviewers)

This document explains how to reproduce the exact Firefox extension package
that was submitted to addons.mozilla.org.

- **Add-on:** PhishBuddy
- **Submitted version:** 0.2.0
- **Public source:** https://github.com/Ivan-Ryukendo/PhishBuddy
- **License:** PolyForm Noncommercial 1.0.0 (source-available, noncommercial)

## What processing the build performs

The build does **not** minify, transpile, concatenate, obfuscate, or otherwise
machine-generate the source. The only transformation is a single, readable
string replacement: `scripts/build-extension.mjs` replaces the line

```
var DEFAULT_API_BASE_URL = "";
```

in `extension/src/config.js` with the backend URL configured for the build,
e.g.

```
var DEFAULT_API_BASE_URL = "https://<backend-host>.convex.site";
```

Everything else is a plain file copy. The submitted files therefore match the
source in this package, except for that one config line.

## Build environment

- **Operating system:** any (Windows, macOS, or Linux). The submitted build was
  produced on Windows 10.
- **Node.js:** version 20 or newer (the project declares `"node": ">=20"`).
- **npm:** the version bundled with Node 20+ (npm 10+). No other tooling is
  required.

## Step-by-step build

From the root of this source package:

```bash
# 1. Install dependencies (uses the included package-lock.json)
npm install

# 2. Configure the backend URL the extension should talk to.
#    Create a file named .env.local in the project root containing:
#       CONVEX_SITE_URL=https://<backend-host>.convex.site
#    (If omitted, DEFAULT_API_BASE_URL stays empty and the extension
#     falls back to its built-in default.)

# 3. Build and package both browser ZIPs
npm run zip:extension
```

This produces, in `dist/`:

- `phishbuddy-firefox-v0.2.0.zip`  ← the Firefox package that was submitted
- `phishbuddy-chrome-v0.2.0.zip`   ← the Chrome equivalent

The Firefox ZIP's contents are assembled by `scripts/package-extension.mjs`
(plain file copy + manifest rename) and zipped by `scripts/zip-extension.mjs`
(a small Node zip writer that forces forward-slash paths so the archive is
valid on AMO).

## Mapping submitted files to source

| Submitted file (inside the ZIP) | Source in this package |
|---|---|
| `manifest.json` | `extension/manifest.firefox.json` (renamed) |
| `src/*.js` | `extension/src/*.js` (copied verbatim, except the one config line) |
| `popup.html`, `popup.css` | `extension/popup.html`, `extension/popup.css` |
| `warning.html`, `warning.css` | `extension/warning.html`, `extension/warning.css` |
| `assets/icons/*.png` | `extension/assets/icons/*.png` (toolbar/store icons, copied verbatim) |
| `assets/icons/phishbuddy-ico.svg` | `extension/assets/icons/phishbuddy-ico.svg` (source logo) |
| `assets/fonts/*.woff2` | `extension/assets/fonts/*.woff2` (bundled UI fonts, copied verbatim) |

## Data handling

The extension checks links by sending the URL being checked to the PhishBuddy
backend (and, when configured server-side, Google Safe Browsing and
VirusTotal). This is declared in the manifest as
`data_collection_permissions: { required: ["browsingActivity"] }`.
Privacy policy: https://ivan-ryukendo.github.io/PhishBuddy/privacy.html
