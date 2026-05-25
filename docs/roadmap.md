# PhishBuddy Roadmap

This roadmap keeps PhishBuddy focused on the smallest useful safety product first.

## Phase 1: Desktop Browser MVP

Build the first working version for Chrome and Firefox on desktop.

Main goals:

- Let users check links from the browser.
- Send links to the PhishBuddy Safety Service.
- Return Clean, Suspicious, or Dangerous.
- Show a short plain-language reason.
- Use Google Safe Browsing, VirusTotal, lookalike domain checks, and cache through the safety service.

Success means a user can check a link in the browser and understand the result without reading a technical report.

Future browser protection, after the MVP is stable:

- Review redirect chains when a page sends the user somewhere unexpected.
- Scan visible page links for risky destinations.
- Detect pages that visually imitate trusted brands.
- Warn on strong impersonation signals without blocking ordinary unknown websites by default.

## Phase 2: Telegram

Add Telegram link checking after the browser MVP is working.

Main goals:

- Let users check links received in Telegram.
- Use the same PhishBuddy Safety Service.
- Keep result labels and reasons consistent with the browser extension.

Success means Telegram users can check links without learning a new safety language or workflow.

## Phase 3: Web App and Android-Shaped App

Build a web app and Android-shaped app experience after Telegram.

Main goals:

- Give users a place to check links outside the browser extension and Telegram.
- Explore account, history, and settings needs.
- Shape the Android experience around the same simple safety result.

Future Scope decisions still needed:

- Whether accounts are required.
- How much link history should be stored.
- What privacy controls users need.
- How Android packaging should work.
- Which alerts or notifications are useful without becoming noisy.

## Phase 4: iOS Release Investigation

Investigate Safari and the best path for an iOS release after the earlier platforms are clearer.

Main goals:

- Confirm the Safari web extension packaging path for macOS, iOS, and iPadOS.
- Understand App Store requirements.
- Choose the best iOS user flow.
- Decide whether iOS should use a share extension, browser-focused flow, app workflow, or a mix.
- Confirm what privacy and permission choices are needed.

Future Scope decisions still needed:

- Final iOS product shape.
- Safari extension packaging and review process.
- Release requirements.
- Supported browsers and sharing flows.
- How closely iOS should match the Android-shaped app.
