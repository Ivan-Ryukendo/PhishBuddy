import { describe, expect, it } from "vitest";
import { combineVerdict } from "../verdict";
import type { SafetySignals } from "../verdict";

const baseSignals: SafetySignals = {
  lookalike: null,
  googleSafeBrowsing: { provider: "googleSafeBrowsing", status: "clean", reasons: [] },
  virusTotal: { provider: "virusTotal", status: "skipped", reasons: ["VirusTotal API key is not configured"] },
  cache: false,
};

describe("combineVerdict", () => {
  it("returns clean when no signal is suspicious", () => {
    expect(combineVerdict("https://example.com", baseSignals).verdict).toBe("clean");
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
