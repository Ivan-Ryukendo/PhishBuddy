import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  checkGoogleSafeBrowsing,
  checkIndexedDomain,
  checkVirusTotal,
  combineVerdict,
  detectLookalike,
  normalizeUrl,
} from "../core";
import type { SafetyResult } from "../core";

const CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_DOMAIN_LIST_LIMIT = 250;
const MAX_DOMAIN_LIST_LIMIT = 1000;
const MAX_URL_LENGTH = 2048;
const MAX_REPORT_NOTE_LENGTH = 500;

type DomainRecord = {
  domain: string;
  status: "verified" | "watchlist" | "blocked";
  reason: string;
  updatedAt: number;
};

export const checkUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<SafetyResult> => {
    assertReasonableUrlInput(args.url);
    const normalized = normalizeUrl(args.url);
    const now = Date.now();
    const domainRecord = await ctx.runQuery(internal.checkUrl.getDomainRecord, {
      hostname: normalized.hostname,
      registeredDomain: normalized.domain,
    });

    const cached = await ctx.runQuery(internal.checkUrl.getCachedResult, {
      normalizedUrl: normalized.url,
      now,
    });

    if (cached !== null) {
      const cachedResult: SafetyResult = {
        verdict: cached.verdict,
        url: cached.url,
        reasons: cached.reasons,
        signals: {
          ...cached.signals,
          indexedDomain:
            cached.signals.indexedDomain ?? checkIndexedDomain(normalized.hostname),
          domainRecord,
          cache: true,
        },
      };
      return sanitizeResult(applyDomainRecord(cachedResult, domainRecord));
    }

    if (domainRecord?.status === "blocked") {
      const blockedResult: SafetyResult = {
        verdict: "dangerous",
        url: normalized.url,
        reasons: [`${domainRecord.domain} is blocked: ${domainRecord.reason}`],
        signals: {
          indexedDomain: checkIndexedDomain(normalized.hostname),
          lookalike: null,
          googleSafeBrowsing: null,
          virusTotal: null,
          domainRecord,
          cache: false,
        },
      };
      await ctx.runMutation(internal.checkUrl.storeCachedResult, {
        originalUrl: args.url,
        normalizedUrl: normalized.url,
        verdict: blockedResult.verdict,
        reasons: blockedResult.reasons,
        signals: blockedResult.signals,
        createdAt: now,
        expiresAt: now + CACHE_TTL_MS,
      });
      return sanitizeResult(blockedResult);
    }

    const indexedDomain = checkIndexedDomain(normalized.hostname);
    const lookalike = detectLookalike(normalized.hostname);
    const [googleSafeBrowsing, virusTotal] = await Promise.all([
      checkGoogleSafeBrowsing(normalized.url),
      checkVirusTotal(normalized.url),
    ]);

    const baseResult = combineVerdict(normalized.url, {
      lookalike,
      indexedDomain,
      googleSafeBrowsing,
      virusTotal,
      domainRecord,
      cache: false,
    });
    const result = sanitizeResult(applyDomainRecord(baseResult, domainRecord));

    await ctx.runMutation(internal.checkUrl.storeCachedResult, {
      originalUrl: args.url,
      normalizedUrl: normalized.url,
      verdict: result.verdict,
      reasons: result.reasons,
      signals: result.signals,
      createdAt: now,
      expiresAt: now + CACHE_TTL_MS,
    });

    return result;
  },
});

export const listDomainRecords = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("verified"),
        v.literal("watchlist"),
        v.literal("blocked"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_DOMAIN_LIST_LIMIT, 1),
      MAX_DOMAIN_LIST_LIMIT,
    );
    const records =
      args.status === undefined
        ? await ctx.db.query("domainRecords").take(limit)
        : await ctx.db
            .query("domainRecords")
            .withIndex("by_status", (q) => q.eq("status", args.status!))
            .take(limit);

    return records.map(publicDomainRecord);
  },
});

export const submitReport = mutation({
  args: {
    url: v.string(),
    note: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal("extension"),
        v.literal("web"),
        v.literal("telegram"),
        v.literal("maintainer"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    assertReasonableUrlInput(args.url);
    if (args.note !== undefined && args.note.length > MAX_REPORT_NOTE_LENGTH) {
      throw new Error(`Report note must be ${MAX_REPORT_NOTE_LENGTH} characters or less`);
    }

    const normalized = normalizeUrl(args.url);
    const now = Date.now();
    const reportId = await ctx.db.insert("linkReports", {
      url: normalized.url,
      domain: normalizeDomainInput(normalized.hostname),
      note: args.note,
      source: args.source ?? "web",
      status: "pending",
      createdAt: now,
    });

    return { reportId, status: "pending" as const };
  },
});

export const upsertDomainRecord = internalMutation({
  args: {
    domain: v.string(),
    status: v.union(
      v.literal("verified"),
      v.literal("watchlist"),
      v.literal("blocked"),
    ),
    reason: v.string(),
    source: v.string(),
    manuallyReviewed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const domain = normalizeDomainInput(args.domain);
    assertValidDomainRecordDomain(domain);
    const now = Date.now();
    const existing = await ctx.db
      .query("domainRecords")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .unique();

    if (existing === null) {
      const recordId = await ctx.db.insert("domainRecords", {
        domain,
        status: args.status,
        reason: args.reason,
        source: args.source,
        manuallyReviewed: args.manuallyReviewed ?? true,
        createdAt: now,
        updatedAt: now,
        lastCheckedAt: now,
      });
      return { recordId, domain, status: args.status };
    }

    await ctx.db.patch(existing._id, {
      status: args.status,
      reason: args.reason,
      source: args.source,
      manuallyReviewed: args.manuallyReviewed ?? existing.manuallyReviewed,
      updatedAt: now,
      lastCheckedAt: now,
    });
    return { recordId: existing._id, domain, status: args.status };
  },
});

export const assertRateLimit = internalMutation({
  args: {
    key: v.string(),
    route: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_key_route", (q) =>
        q.eq("key", args.key).eq("route", args.route),
      )
      .unique();

    if (
      existing === null ||
      args.now - existing.windowStart >= args.windowMs
    ) {
      if (existing === null) {
        await ctx.db.insert("rateLimitBuckets", {
          key: args.key,
          route: args.route,
          windowStart: args.now,
          count: 1,
          updatedAt: args.now,
        });
      } else {
        await ctx.db.patch(existing._id, {
          windowStart: args.now,
          count: 1,
          updatedAt: args.now,
        });
      }
      return;
    }

    if (existing.count >= args.maxRequests) {
      throw new Error("Too many requests. Try again later.");
    }

    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      updatedAt: args.now,
    });
  },
});

export const getCachedResult = internalQuery({
  args: {
    normalizedUrl: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("cachedUrlResults")
      .withIndex("by_normalized_url", (q) =>
        q.eq("normalizedUrl", args.normalizedUrl),
      )
      .order("desc")
      .first();

    if (doc === null || doc.expiresAt <= args.now) {
      return null;
    }

    return {
      verdict: doc.verdict,
      url: doc.normalizedUrl,
      reasons: doc.reasons,
      signals: doc.signals,
    };
  },
});

export const storeCachedResult = internalMutation({
  args: {
    originalUrl: v.string(),
    normalizedUrl: v.string(),
    verdict: v.union(
      v.literal("clean"),
      v.literal("suspicious"),
      v.literal("dangerous"),
    ),
    reasons: v.array(v.string()),
    signals: v.any(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cachedUrlResults")
      .withIndex("by_normalized_url", (q) =>
        q.eq("normalizedUrl", args.normalizedUrl),
      )
      .order("desc")
      .first();

    if (existing === null) {
      await ctx.db.insert("cachedUrlResults", args);
      return;
    }

    await ctx.db.patch(existing._id, args);
  },
});

export const getDomainRecord = internalQuery({
  args: {
    hostname: v.string(),
    registeredDomain: v.string(),
  },
  handler: async (ctx, args): Promise<DomainRecord | null> => {
    for (const domain of getDomainCandidates(args.hostname, args.registeredDomain)) {
      const record = await ctx.db
        .query("domainRecords")
        .withIndex("by_domain", (q) => q.eq("domain", domain))
        .unique();
      if (record !== null) {
        return publicDomainRecord(record);
      }
    }
    return null;
  },
});

function applyDomainRecord(
  result: SafetyResult,
  record: DomainRecord | null,
): SafetyResult {
  if (record === null) {
    return result;
  }

  const reasons = new Set(result.reasons);
  if (record.status === "verified") {
    reasons.add(`${record.domain} is verified in the public PhishBuddy index.`);
    return {
      ...result,
      reasons: [...reasons],
      signals: { ...result.signals, domainRecord: record },
    };
  }

  if (record.status === "watchlist") {
    reasons.add(`${record.domain} is on the watchlist: ${record.reason}`);
    return {
      ...result,
      verdict: result.verdict === "dangerous" ? "dangerous" : "suspicious",
      reasons: [...reasons],
      signals: { ...result.signals, domainRecord: record },
    };
  }

  reasons.add(`${record.domain} is blocked: ${record.reason}`);
  return {
    ...result,
    verdict: "dangerous",
    reasons: [...reasons],
    signals: { ...result.signals, domainRecord: record },
  };
}

function publicDomainRecord(record: {
  domain: string;
  status: "verified" | "watchlist" | "blocked";
  reason: string;
  updatedAt: number;
}): DomainRecord {
  return {
    domain: record.domain,
    status: record.status,
    reason: record.reason,
    updatedAt: record.updatedAt,
  };
}

function getDomainCandidates(hostname: string, registeredDomain: string): string[] {
  const normalized = normalizeDomainInput(hostname);
  const candidates = [normalized, normalizeDomainInput(registeredDomain)];
  if (normalized.startsWith("www.")) {
    candidates.push(normalized.slice(4));
  }

  return [...new Set(candidates)];
}

function normalizeDomainInput(value: string): string {
  let domain = value.trim().toLowerCase();
  if (domain.includes("://")) {
    domain = new URL(domain).hostname.toLowerCase();
  }
  return domain.replace(/^\.+/, "").replace(/\.+$/, "").replace(/^www\./, "");
}

function assertValidDomainRecordDomain(domain: string): void {
  const labels = domain.split(".").filter(Boolean);
  if (labels.length < 2 || labels.some((label) => label.length === 0)) {
    throw new Error("Domain records must use a registrable domain such as example.com");
  }
}

function assertReasonableUrlInput(url: string): void {
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL must be ${MAX_URL_LENGTH} characters or less`);
  }
}

function sanitizeResult(result: SafetyResult): SafetyResult {
  return {
    ...result,
    signals: {
      ...result.signals,
      googleSafeBrowsing: sanitizeProviderSignal(result.signals.googleSafeBrowsing),
      virusTotal: sanitizeProviderSignal(result.signals.virusTotal),
    },
  };
}

function sanitizeProviderSignal<T extends { raw?: unknown } | null>(
  signal: T,
): T {
  if (signal === null || signal.raw === undefined) {
    return signal;
  }
  const { raw, ...safeSignal } = signal;
  void raw;
  return safeSignal as T;
}
