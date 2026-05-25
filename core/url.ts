export type NormalizedUrl = {
  input: string;
  url: string;
  hostname: string;
  domain: string;
};

const MULTI_PART_PUBLIC_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.jp",
  "com.br",
  "com.mx",
  "co.nz",
]);

export function normalizeUrl(input: string): NormalizedUrl {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("URL must be a non-empty string");
  }

  const parsed = new URL(input.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  if (
    (parsed.protocol === "https:" && parsed.port === "443") ||
    (parsed.protocol === "http:" && parsed.port === "80")
  ) {
    parsed.port = "";
  }

  if (parsed.pathname === "/") {
    parsed.pathname = "";
  }

  const hostname = parsed.hostname.replace(/\.$/, "");
  return {
    input,
    url: parsed.toString(),
    hostname,
    domain: extractDomain(hostname),
  };
}

export function extractHostname(input: string): string {
  return normalizeUrl(input).hostname;
}

export function extractDomain(hostname: string): string {
  const clean = hostname.toLowerCase().replace(/\.$/, "");
  const labels = clean.split(".").filter(Boolean);

  if (labels.length <= 2) {
    return clean;
  }

  const suffix = labels.slice(-2).join(".");
  if (MULTI_PART_PUBLIC_SUFFIXES.has(suffix) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }

  return labels.slice(-2).join(".");
}
