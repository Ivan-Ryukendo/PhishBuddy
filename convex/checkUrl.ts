import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  checkGoogleSafeBrowsing,
  checkVirusTotal,
  combineVerdict,
  detectLookalike,
  normalizeUrl,
} from "../core";
import type { SafetyResult } from "../core";

const CACHE_TTL_MS = 15 * 60 * 1000;

export const checkUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<SafetyResult> => {
    const normalized = normalizeUrl(args.url);
    const now = Date.now();

    const cached = await ctx.runQuery(internal.checkUrl.getCachedResult, {
      normalizedUrl: normalized.url,
      now,
    });

    if (cached !== null) {
      return {
        verdict: cached.verdict,
        url: cached.url,
        reasons: cached.reasons,
        signals: {
          ...cached.signals,
          cache: true,
        },
      };
    }

    const lookalike = detectLookalike(normalized.hostname);
    const [googleSafeBrowsing, virusTotal] = await Promise.all([
      checkGoogleSafeBrowsing(normalized.url),
      checkVirusTotal(normalized.url),
    ]);

    const result = combineVerdict(normalized.url, {
      lookalike,
      googleSafeBrowsing,
      virusTotal,
      cache: false,
    });

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
    await ctx.db.insert("cachedUrlResults", args);
  },
});
