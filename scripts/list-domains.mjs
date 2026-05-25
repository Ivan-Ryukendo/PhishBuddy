import { getApiBaseUrl, loadLocalEnv } from "./env.mjs";

const VALID_STATUSES = new Set(["verified", "watchlist", "blocked"]);

loadLocalEnv();

const [, , status] = process.argv;
if (status && !VALID_STATUSES.has(status)) {
  console.error("Optional status must be one of: verified, watchlist, blocked");
  process.exit(1);
}

const url = new URL(`${getApiBaseUrl()}/domains`);
if (status) {
  url.searchParams.set("status", status);
}

const response = await fetch(url);
const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(body.error ?? `List failed with HTTP ${response.status}`);
  process.exit(1);
}

const records = Array.isArray(body.records) ? body.records : [];
if (records.length === 0) {
  console.log("No domain records found.");
  process.exit(0);
}

for (const record of records) {
  console.log(
    `${record.status.padEnd(9)} ${record.domain.padEnd(32)} ${record.reason}`,
  );
}
