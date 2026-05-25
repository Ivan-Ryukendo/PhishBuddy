# PhishBuddy

PhishBuddy is an open-source project that helps people avoid phishing links before they click.

The first version is focused on desktop browser protection for Chrome and Firefox. A user should be able to check a link from the browser and receive a plain result: Clean, Suspicious, or Dangerous, with a short reason.

## MVP Scope

The browser MVP focuses on:

- Checking links from Chrome and Firefox.
- Sending links to the PhishBuddy Safety Service.
- Returning a simple safety result.
- Explaining the reason in plain language.
- Keeping the user experience fast and understandable.

The MVP does not try to replace careful judgment, password managers, browser warnings, or security tools. It adds a clear safety check at the moment a user is about to trust a link.

## Planned Platforms

PhishBuddy is planned in this order:

1. Desktop browser protection for Chrome and Firefox.
2. Telegram link checking.
3. Web app and Android-shaped app experience.
4. iOS release investigation and later iOS release.

## Safety Service

Convex is planned as the central PhishBuddy Safety Service. Browser extensions and later apps send links to this service. The service checks trusted safety sources, lookalike domain signals, and cached results, then returns a plain result to the user.

Google Safe Browsing is a safety source. Google Search ranking is not a safety source.

## Setup

Install dependencies:

```powershell
npm install
```

Create local configuration from the example:

```powershell
Copy-Item .env.example .env
```

Required service keys are configured in Convex, not inside the browser extension:

- `GOOGLE_SAFE_BROWSING_API_KEY`
- `VIRUSTOTAL_API_KEY`

Do not commit real API keys or secrets.

## Local Checks

Run tests:

```powershell
npm test
```

Run TypeScript checks:

```powershell
npm run typecheck
```

Build browser extension files:

```powershell
npm run build:extension
npm run package:extension
```

The packaged extension folders are:

- `dist/extension/chrome`
- `dist/extension/firefox`

After loading an extension, open its settings and enter the Convex HTTP Actions URL for the PhishBuddy Safety Service, for example:

```text
https://your-convex-deployment.convex.site
```

## Convex

The backend is designed for Convex. Local Convex code generation can be refreshed with the Convex CLI:

```powershell
npx convex dev
```

Deployment should only happen after provider keys are configured in the Convex dashboard and local tests pass.

## Contributing

Contributions are welcome. Please start with a small issue or discussion before making a large change. PhishBuddy values plain language, focused safety behavior, and careful handling of user trust.

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/blueprint.md](docs/blueprint.md) before working on product behavior or platform architecture.
