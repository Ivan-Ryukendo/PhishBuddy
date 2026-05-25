import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const verdict = v.union(
  v.literal("clean"),
  v.literal("suspicious"),
  v.literal("dangerous"),
);

const providerStatus = v.union(
  v.literal("clean"),
  v.literal("suspicious"),
  v.literal("dangerous"),
  v.literal("skipped"),
  v.literal("rate_limited"),
  v.literal("error"),
);

const providerSignal = v.object({
  provider: v.union(
    v.literal("googleSafeBrowsing"),
    v.literal("virusTotal"),
  ),
  status: providerStatus,
  reasons: v.array(v.string()),
  raw: v.optional(v.any()),
});

export default defineSchema({
  cachedUrlResults: defineTable({
    originalUrl: v.string(),
    normalizedUrl: v.string(),
    verdict,
    reasons: v.array(v.string()),
    signals: v.object({
      lookalike: v.union(v.null(), v.any()),
      googleSafeBrowsing: v.union(v.null(), providerSignal),
      virusTotal: v.union(v.null(), providerSignal),
      cache: v.boolean(),
    }),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_normalized_url", ["normalizedUrl"]),
});
