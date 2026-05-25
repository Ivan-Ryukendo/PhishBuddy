# PhishBuddy

PhishBuddy is an open-source phishing link checker for desktop browsers. The current codebase contains a Chrome and Firefox extension, shared URL safety logic, and a Convex backend that returns one of three plain-language verdicts:

- `clean`
- `suspicious`
- `dangerous`

The project is intentionally focused on a small MVP: check a URL, combine available safety signals, and show a short reason that a normal user can understand. It is not a replacement for browser protections, password managers, security awareness, or endpoint security tools.

## Current MVP Status

Implemented in this repository:

- Shared TypeScript core for URL normalization, lookalike-domain detection, provider checks, and verdict combination.
- Convex backend action and HTTP endpoint at `POST /check-url`.
- Cache table for recent URL results.
- Browser extension source for Chrome Manifest V3 and Firefox Manifest V2.
- Extension popup, options page, background navigation checks, and warning page assets.
- Unit tests for core logic and extension JavaScript modules.
- Build scripts that prepare unpacked Chrome and Firefox extension folders under `dist/extension`.

Provider integrations currently supported by the backend code:

- Google Safe Browsing
- VirusTotal
- Local lookalike-domain heuristics for a small protected-domain list
- Short-lived Convex cache

Planned later platforms are documented in [docs/roadmap.md](docs/roadmap.md). The active implementation focus is still the desktop browser MVP.

## Architecture Overview

```text
Browser extension
  -> POST { url } to Convex HTTP Actions URL /check-url
    -> Convex action normalizes the URL
    -> checks cachedUrlResults
    -> runs lookalike, Google Safe Browsing, and VirusTotal checks
    -> combines signals into clean/suspicious/dangerous
  <- JSON safety result with reasons and signals
```

Main boundaries:

- `extension/` contains browser UI, extension manifests, and client-side JavaScript.
- `core/` contains reusable TypeScript safety logic used by Convex and covered by tests.
- `convex/` contains the backend HTTP route, Convex action, internal cache query/mutation, and schema.
- `scripts/` contains build, package, and test orchestration scripts.

The browser extension does not contain provider API keys. It only needs the base URL for the deployed Convex HTTP Actions service, stored through the extension options page.

## Repository Layout

```text
.
+-- convex/
|   +-- checkUrl.ts           # Convex action plus cache query/mutation
|   +-- http.ts               # HTTP route for POST /check-url
|   +-- schema.ts             # cachedUrlResults table
+-- core/
|   +-- providers.ts          # Google Safe Browsing and VirusTotal clients
|   +-- similarity.ts         # lookalike-domain detection
|   +-- url.ts                # URL normalization helpers
|   +-- verdict.ts            # signal-to-verdict logic
+-- docs/
|   +-- blueprint.md          # product and system direction
|   +-- roadmap.md            # phased platform plan
+-- extension/
|   +-- manifest.chrome.json  # Chrome MV3 manifest source
|   +-- manifest.firefox.json # Firefox MV2 manifest source
|   +-- src/                  # extension runtime scripts
|   +-- __tests__/            # extension module tests
+-- scripts/
|   +-- build-extension.mjs
|   +-- package-extension.mjs
|   +-- run-tests.mjs
+-- .env.example
+-- package.json
+-- tsconfig.json
```

Generated output:

- `dist/extension-source` is created by `npm run build:extension`.
- `dist/extension/chrome` and `dist/extension/firefox` are created by `npm run package:extension`.

## Prerequisites

- Node.js `>=20`
- npm
- A Convex project/deployment for backend development or extension testing against a live safety service
- Provider API keys if you want Google Safe Browsing and VirusTotal checks to run instead of being reported as skipped

Install dependencies:

```powershell
npm install
```

## Environment Variables

Start from the example file:

```powershell
Copy-Item .env.example .env
```

Variables currently documented by the repository:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PHISHBUDDY_API_BASE_URL` | Local/developer configuration and extension setup reference | Convex HTTP Actions base URL, for example `https://your-deployment.convex.site`. |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Convex/backend runtime | Enables Google Safe Browsing provider checks. |
| `VIRUSTOTAL_API_KEY` | Convex/backend runtime | Enables VirusTotal provider checks. |
| `PHISHBUDDY_CACHE_TTL_SECONDS` | Reserved example setting | Not currently read by the runtime. The backend uses a 15-minute constant in `convex/checkUrl.ts`. |

Do not put provider keys into the extension source or commit real secrets. Configure backend secrets through the Convex environment for the deployment that handles safety checks.

## Development Commands

Run the test suite:

```powershell
npm test
```

Run TypeScript checks:

```powershell
npm run typecheck
```

Build extension source files:

```powershell
npm run build:extension
```

Create unpacked Chrome and Firefox extension folders:

```powershell
npm run package:extension
```

Run the default build script:

```powershell
npm run build
```

Convex helper scripts:

```powershell
npm run convex:dev
npm run convex:deploy
```

## Browser Extension Installation

Build the unpacked extension folders first:

```powershell
npm run package:extension
```

Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select `dist/extension/chrome`.
5. Open the PhishBuddy extension options page and set the Convex HTTP Actions base URL, such as `https://your-deployment.convex.site`.

Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose "Load Temporary Add-on".
3. Select `dist/extension/firefox/manifest.json`.
4. Open the PhishBuddy extension options page and set the Convex HTTP Actions base URL.

The extension sends checks to:

```text
{PHISHBUDDY_API_BASE_URL}/check-url
```

The expected request body is:

```json
{ "url": "https://example.com" }
```

## Convex Backend Notes

The Convex backend exposes a CORS-enabled HTTP route in `convex/http.ts`:

- `OPTIONS /check-url`
- `POST /check-url`

`POST /check-url` expects JSON with a string `url` field. It calls `api.checkUrl.checkUrl`, which:

- normalizes the submitted URL,
- checks `cachedUrlResults` for a non-expired result,
- runs lookalike-domain detection,
- checks Google Safe Browsing and VirusTotal when keys are configured,
- stores a cached result,
- returns a `SafetyResult`.

The cache schema is defined in `convex/schema.ts` and indexed by `normalizedUrl`.

For local Convex development, use:

```powershell
npm run convex:dev
```

Before deploying, make sure provider keys are configured in Convex and the local tests/type checks pass.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [docs/blueprint.md](docs/blueprint.md), and [docs/roadmap.md](docs/roadmap.md) before changing product behavior or platform direction.

Contribution guidelines:

- Keep pull requests small and focused.
- Preserve the current MVP focus unless the project direction changes.
- Add or update tests for behavior changes.
- Keep user-facing safety language plain and specific.
- Avoid unrelated cleanup in feature or bug-fix pull requests.
- Do not overwrite concurrent work from other contributors or agents.

Useful checks before opening a pull request:

```powershell
npm test
npm run typecheck
npm run package:extension
```

## Security and Privacy Notes

- Treat submitted URLs as sensitive data. URLs can reveal accounts, workplaces, private messages, tokens, or personal activity.
- Do not commit API keys, tokens, secrets, private Convex configuration, or packaged credentials.
- Provider API keys belong in the backend environment, not in browser extension files.
- The current backend stores cached URL results in Convex to reduce repeat provider calls. Review retention behavior carefully before production use.
- The current CORS policy in `convex/http.ts` allows all origins. That is practical for extension development, but production deployments should review access controls and abuse prevention.
- A `clean` result means no configured check produced a warning. It does not prove that a URL is safe.
- Provider failures, missing keys, and rate limits are represented as provider signals; they should not be hidden in user-facing behavior.
