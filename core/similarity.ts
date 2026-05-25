import { extractDomain } from "./url";

export type LookalikeSignal = {
  protectedDomain: string;
  candidateDomain: string;
  distance: number;
  normalizedCandidate: string;
  reasons: string[];
  severity: "low" | "medium" | "high";
};

export type IndexedDomainSignal = {
  status: "indexed" | "not_indexed";
  domain: string;
  matchedDomain: string | null;
  reasons: string[];
};

export const PROTECTED_DOMAINS = [
  "google.com",
  "youtube.com",
  "microsoft.com",
  "microsoftonline.com",
  "apple.com",
  "amazon.com",
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "chatgpt.com",
  "wikipedia.org",
  "reddit.com",
  "x.com",
  "bing.com",
  "yahoo.com",
  "duckduckgo.com",
  "tiktok.com",
  "netflix.com",
  "paypal.com",
  "chase.com",
  "bankofamerica.com",
  "wellsfargo.com",
  "canva.com",
  "github.com",
  "linkedin.com",
  "adobe.com",
  "dropbox.com",
  "office.com",
  "outlook.com",
  "icloud.com",
  "salesforce.com",
  "shopify.com",
  "ebay.com",
  "walmart.com",
  "target.com",
  "bestbuy.com",
] as const;

const HOMOGRAPH_MAP: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "|": "l",
  "\u0430": "a",
  "\u0435": "e",
  "\u043e": "o",
  "\u0440": "p",
  "\u0441": "c",
  "\u0443": "y",
  "\u0445": "x",
  "\u0456": "i",
  "\u04cf": "l",
  "\u0251": "a",
  "\u03bf": "o",
  "\u03c1": "p",
};

export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

export function normalizeForSimilarity(value: string): string {
  return Array.from(value.toLowerCase())
    .map((char) => HOMOGRAPH_MAP[char] ?? char)
    .join("");
}

export function checkIndexedDomain(
  hostnameOrDomain: string,
  indexedDomains: readonly string[] = PROTECTED_DOMAINS,
): IndexedDomainSignal {
  const domain = hostnameOrDomain.includes(".")
    ? extractDomain(hostnameOrDomain)
    : hostnameOrDomain.toLowerCase();
  const matchedDomain =
    indexedDomains.find((indexedDomain) => domain === indexedDomain) ?? null;

  if (matchedDomain) {
    return {
      status: "indexed",
      domain,
      matchedDomain,
      reasons: [`${domain} is in the indexed trusted-domain list.`],
    };
  }

  return {
    status: "not_indexed",
    domain,
    matchedDomain: null,
    reasons: [`${domain} has not been indexed as a trusted domain yet.`],
  };
}

export function detectLookalike(
  hostnameOrDomain: string,
  protectedDomains: readonly string[] = PROTECTED_DOMAINS,
): LookalikeSignal | null {
  const candidateDomain = hostnameOrDomain.includes(".")
    ? extractDomain(hostnameOrDomain)
    : hostnameOrDomain.toLowerCase();
  const normalizedCandidate = normalizeForSimilarity(candidateDomain);

  for (const protectedDomain of protectedDomains) {
    const normalizedProtected = normalizeForSimilarity(protectedDomain);
    if (candidateDomain === protectedDomain) {
      continue;
    }

    const reasons: string[] = [];
    const candidateName = normalizedCandidate.split(".")[0] ?? normalizedCandidate;
    const protectedName = normalizedProtected.split(".")[0] ?? normalizedProtected;
    const distance = levenshtein(candidateName, protectedName);

    if (normalizedCandidate === normalizedProtected) {
      reasons.push("domain becomes a protected brand after character normalization");
    }

    if (protectedName.length >= 4 && distance > 0 && distance <= 1) {
      reasons.push("domain is one edit away from a protected brand");
    }

    if (
      protectedName.length >= 4 &&
      candidateName.includes(protectedName) &&
      candidateName !== protectedName
    ) {
      reasons.push("domain embeds a protected brand name");
    }

    const suspiciousHyphen =
      protectedName.length >= 4 &&
      (candidateName.startsWith(`${protectedName}-`) ||
        candidateName.endsWith(`-${protectedName}`));
    if (suspiciousHyphen) {
      reasons.push("domain uses a protected brand with a hyphenated modifier");
    }

    if (reasons.length > 0 && normalizedCandidate !== candidateDomain) {
      reasons.push("domain contains homograph-like character substitutions");
    }

    if (reasons.length > 0) {
      return {
        protectedDomain,
        candidateDomain,
        distance,
        normalizedCandidate,
        reasons,
        severity:
          normalizedCandidate === normalizedProtected ||
          reasons.length > 1 ||
          distance === 1
            ? "high"
            : "medium",
      };
    }
  }

  return null;
}
