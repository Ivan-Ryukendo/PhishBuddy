import { describe, expect, it } from "vitest";
import { combineVerdict } from "../verdict";
import type { SafetySignals } from "../verdict";

const baseSignals: SafetySignals = {
  indexedDomain: {
    status: "not_indexed",
    domain: "example.com",
    matchedDomain: null,
    reasons: ["example.com has not been indexed as a trusted domain yet."],
  },
  lookalike: null,
  googleSafeBrowsing: { provider: "googleSafeBrowsing", status: "clean", reasons: [] },
  virusTotal: { provider: "virusTotal", status: "skipped", reasons: ["VirusTotal API key is not configured"] },
  cache: false,
};

describe("combineVerdict", () => {
  it("returns clean when no signal is suspicious", () => {
    expect(combineVerdict("https://example.com", baseSignals).verdict).toBe("clean");
  });

  it("includes indexed-domain reasons for indexed clean domains", () => {
    const result = combineVerdict("https://google.com", {
      ...baseSignals,
      indexedDomain: {
        status: "indexed",
        domain: "google.com",
        matchedDomain: "google.com",
        reasons: ["google.com is in the indexed trusted-domain list."],
      },
    });

    expect(result.verdict).toBe("clean");
    expect(result.reasons).toContain("google.com is in the indexed trusted-domain list.");
  });

  it("returns suspicious for lookalike matches", () => {
    const result = combineVerdict("https://paypa1.com", {
      ...baseSignals,
      lookalike: {
        protectedDomain: "paypal.com",
        candidateDomain: "paypa1.com",
        distance: 1,
        normalizedCandidate: "paypal.com",
        reasons: ["domain is one edit away from a protected brand"],
        severity: "high",
      },
    });

    expect(result.verdict).toBe("suspicious");
    expect(result.reasons[0]).toContain("paypa1.com");
  });

  it("returns dangerous when a provider reports danger", () => {
    const result = combineVerdict("https://bad.test", {
      ...baseSignals,
      googleSafeBrowsing: {
        provider: "googleSafeBrowsing",
        status: "dangerous",
        reasons: ["Google Safe Browsing matched SOCIAL_ENGINEERING"],
      },
    });

    expect(result.verdict).toBe("dangerous");
  });
});
