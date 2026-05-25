# Trusted Index Status Fix Plan

## Problem

The Convex trusted-domain index is working, but the browser extension can still show a verified domain as `Not indexed`.

Example:

- URL: `https://services.nidw.gov.bd/nid-pub/`
- Backend result: `services.nidw.gov.bd` is verified in the public PhishBuddy index.
- Popup result: `Not indexed` / `Caution`.

This happens because the extension UI still prioritizes the older `signals.indexedDomain.status === "not_indexed"` signal from the built-in protected-domain list. The newer Convex-backed trusted index is returned as `signals.domainRecord.status === "verified"`, but the popup, page notice, and background notice logic do not consistently treat that as the higher-priority signal.

## Reason For Fixing

Trusted domains added through Convex must immediately appear as trusted to users without requiring a new database bundle or manual extension-side list update. If the UI says `Not indexed` while the backend says `verified`, users lose confidence in the index and maintainers cannot rely on the Convex admin workflow.

The extension should clearly separate:

- Backend verified domains from the public trusted index.
- Locally protected/lookalike domains used for heuristics.
- Unknown domains that are genuinely not indexed.

## Intended Rule

Use the Convex domain record first:

```text
if signals.domainRecord.status === "verified":
  show Secure / Verified
else if result.verdict === "clean" and signals.indexedDomain.status === "not_indexed":
  show Not indexed / Caution
else:
  show the normal verdict state
```

Blocked and watchlist records should keep their current stricter behavior:

- `blocked` remains `Dangerous`.
- `watchlist` remains `Caution` / `Suspicious`.

## Implementation Steps

1. Update `extension/src/ui.js` so `domainRecord.status === "verified"` prevents the `notIndexed` display state.
2. Update `extension/src/content.js` so the in-page notice does not warn `Not indexed` for Convex-verified domains.
3. Update `extension/src/background.js` so navigation notices do not trigger for Convex-verified domains.
4. Review `extension/src/pageRisk.js` so page-risk merging does not downgrade a verified domain because the older local `indexedDomain` signal says `not_indexed`.
5. Add or update extension tests for:
   - verified Convex domain + local not-indexed signal => secure/verified display
   - clean unknown domain + local not-indexed signal => not indexed/caution display
   - watchlist and blocked records still override normal clean behavior
6. Run:

```powershell
npm test
npm run typecheck
npm run package:extension
```

## Release Note

This is an extension code fix, not a Convex database fix. After implementation, the extension package must be rebuilt and released/reloaded once. Future trusted-domain additions in Convex should then display correctly without requiring an extension release.
