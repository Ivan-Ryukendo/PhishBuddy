import { getApiBaseUrl, loadLocalEnv } from "./env.mjs";

const VALID_STATUSES = new Set(["verified", "watchlist", "blocked"]);

loadLocalEnv();

const [, , domain, status, reason, source = "manual-review"] = process.argv;

if (!domain || !status || !reason) {
  printUsageAndExit();
}

if (!VALID_STATUSES.has(status)) {
  console.error("Status must be one of: verified, watchlist, blocked");
  process.exit(1);
}

const token = process.env.PHISHBUDDY_MAINTAINER_TOKEN;
if (!token) {
  console.error("PHISHBUDDY_MAINTAINER_TOKEN is not configured");
  process.exit(1);
}

const response = await fetch(`${getApiBaseUrl()}/maintainer/domains`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    domain,
    status,
    reason,
    source,
    manuallyReviewed: true,
  }),
});

const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(body.error ?? `Update failed with HTTP ${response.status}`);
  process.exit(1);
}

console.log(`Updated ${body.domain} as ${body.status}`);

function printUsageAndExit() {
  console.error(
    [
      "Usage:",
      '  npm run domains:upsert -- <domain> <verified|watchlist|blocked> "<reason>" [source]',
      "",
      "Examples:",
      '  npm run domains:upsert -- github.com verified "Official GitHub domain" manual-review',
      '  npm run domains:upsert -- suspicious-login.example watchlist "Reported for review" community-report',
    ].join("\n"),
  );
  process.exit(1);
}
