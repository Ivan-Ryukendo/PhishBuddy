import { describe, expect, it } from "vitest";
import {
  checkIndexedDomain,
  detectLookalike,
  levenshtein,
  normalizeForSimilarity,
} from "../similarity";

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

  it("does not flag arbitrary domains because of short protected domains", () => {
    expect(detectLookalike("example.com")).toBeNull();
    expect(detectLookalike("a.com")).toBeNull();
  });
});

describe("checkIndexedDomain", () => {
  it("marks protected domains as indexed", () => {
    expect(checkIndexedDomain("google.com")).toMatchObject({
      status: "indexed",
      matchedDomain: "google.com",
    });
    expect(checkIndexedDomain("www.google.com")).toMatchObject({
      status: "indexed",
      matchedDomain: "google.com",
    });
  });

  it("marks unknown domains as not indexed", () => {
    expect(checkIndexedDomain("example.test")).toMatchObject({
      status: "not_indexed",
      matchedDomain: null,
    });
  });
});
