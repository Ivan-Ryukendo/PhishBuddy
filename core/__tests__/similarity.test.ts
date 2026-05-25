import { describe, expect, it } from "vitest";
import { detectLookalike, levenshtein, normalizeForSimilarity } from "../similarity";

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("paypal", "paypa1")).toBe(1);
  });
});

describe("detectLookalike", () => {
  it("ignores exact protected domains", () => {
    expect(detectLookalike("paypal.com")).toBeNull();
  });

  it("flags one-edit typosquats", () => {
    const signal = detectLookalike("paypa1.com");
    expect(signal?.protectedDomain).toBe("paypal.com");
    expect(signal?.severity).toBe("high");
  });

  it("normalizes homograph-like substitutions", () => {
    expect(normalizeForSimilarity("g00gle.com")).toBe("google.com");
    expect(detectLookalike("g00gle.com")?.protectedDomain).toBe("google.com");
  });

  it("flags embedded brand domains", () => {
    expect(detectLookalike("paypal-secure.example")?.protectedDomain).toBe("paypal.com");
  });
});
