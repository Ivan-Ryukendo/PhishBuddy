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

const domainStatus = v.union(
  v.literal("verified"),
  v.literal("watchlist"),
  v.literal("blocked"),
);

const reportStatus = v.union(
  v.literal("pending"),
  v.literal("reviewed"),
  v.literal("rejected"),
);

export default defineSchema({
  cachedUrlResults: defineTable({
    originalUrl: v.string(),
    normalizedUrl: v.string(),
    verdict,
    reasons: v.array(v.string()),
    signals: v.object({
      indexedDomain: v.optional(v.union(v.null(), v.any())),
      lookalike: v.union(v.null(), v.any()),
      googleSafeBrowsing: v.union(v.null(), providerSignal),
      virusTotal: v.union(v.null(), providerSignal),
      domainRecord: v.optional(v.union(v.null(), v.any())),
      cache: v.boolean(),
    }),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_normalized_url", ["normalizedUrl"]),
  domainRecords: defineTable({
    domain: v.string(),
    status: domainStatus,
    reason: v.string(),
    source: v.string(),
    manuallyReviewed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastCheckedAt: v.optional(v.number()),
  })
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),
  linkReports: defineTable({
    url: v.string(),
    domain: v.string(),
    note: v.optional(v.string()),
    source: v.union(
      v.literal("extension"),
      v.literal("web"),
      v.literal("telegram"),
      v.literal("maintainer"),
    ),
    status: reportStatus,
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),
  rateLimitBuckets: defineTable({
    key: v.string(),
    route: v.string(),
    windowStart: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_key_route", ["key", "route"]),
});
