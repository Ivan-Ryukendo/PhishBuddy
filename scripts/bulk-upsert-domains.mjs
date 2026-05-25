import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getApiBaseUrl, loadLocalEnv } from "./env.mjs";

const VALID_STATUSES = new Set(["verified", "watchlist", "blocked"]);

loadLocalEnv();

const [, , filePath = "data/trusted-domains.json", status = "verified"] = process.argv;

if (!VALID_STATUSES.has(status)) {
  console.error("Status must be one of: verified, watchlist, blocked");
  process.exit(1);
}

const token = process.env.PHISHBUDDY_MAINTAINER_TOKEN;
if (!token) {
  console.error("PHISHBUDDY_MAINTAINER_TOKEN is not configured");
  process.exit(1);
}

const groups = JSON.parse(readFileSync(resolve(filePath), "utf8"));
if (!Array.isArray(groups)) {
  console.error("Trusted domain file must contain an array of groups");
  process.exit(1);
}

const records = [];
const seen = new Set();
for (const group of groups) {
  if (
    typeof group !== "object" ||
    group === null ||
    typeof group.category !== "string" ||
    typeof group.reason !== "string" ||
    !Array.isArray(group.domains)
  ) {
    console.error("Each group must include category, reason, and domains");
    process.exit(1);
  }

  for (const rawDomain of group.domains) {
    if (typeof rawDomain !== "string") {
      console.error(`Invalid domain in ${group.category}`);
      process.exit(1);
    }
    const domain = normalizeDomain(rawDomain);
    if (seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    records.push({
      domain,
      status,
      reason: group.reason,
      source: `seed:${group.category}`,
    });
  }
}

let updated = 0;
const failures = [];
for (const record of records) {
  const response = await fetch(`${getApiBaseUrl()}/maintainer/domains`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...record,
      manuallyReviewed: true,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = body.error ?? `HTTP ${response.status}`;
    failures.push({ domain: record.domain, error });
    console.error(`Failed to update ${record.domain}: ${error}`);
    continue;
  }

  updated += 1;
  console.log(`Updated ${body.domain} as ${body.status}`);
}

console.log(`Bulk update complete: ${updated} ${status} domains.`);
if (failures.length > 0) {
  console.error(`Failed domains: ${failures.map((failure) => failure.domain).join(", ")}`);
  process.exit(1);
}

function normalizeDomain(value) {
  let domain = value.trim().toLowerCase();
  if (domain.includes("://")) {
    domain = new URL(domain).hostname.toLowerCase();
  }
  return domain.replace(/^\.+/, "").replace(/\.+$/, "").replace(/^www\./, "");
}
