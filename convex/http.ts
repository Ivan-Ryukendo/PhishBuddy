import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();
const MAX_CHECK_REQUESTS_PER_MINUTE = 60;
const MAX_REPORTS_PER_TEN_MINUTES = 10;
const MAX_URL_LENGTH = 2048;
const MAX_REPORT_NOTE_LENGTH = 500;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const maintainerHeaders = {
  "access-control-allow-origin": "null",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
};

http.route({
  path: "/check-url",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/domains",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const limitValue = url.searchParams.get("limit");
    const limit = limitValue === null ? undefined : Number(limitValue);

    if (
      status !== undefined &&
      status !== "verified" &&
      status !== "watchlist" &&
      status !== "blocked"
    ) {
      return jsonResponse({ error: "Invalid status filter" }, 400);
    }

    if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
      return jsonResponse({ error: "Invalid limit" }, 400);
    }

    const records = await ctx.runQuery(api.checkUrl.listDomainRecords, {
      status,
      limit,
    });
    return jsonResponse({ records }, 200);
  }),
});

http.route({
  path: "/domains",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/reports",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/reports",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      await assertHttpRateLimit(
        ctx,
        request,
        "reports",
        MAX_REPORTS_PER_TEN_MINUTES,
        10 * 60 * 1000,
      );
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Too many requests" },
        429,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as { url?: unknown }).url !== "string"
    ) {
      return jsonResponse({ error: 'Request JSON must include a string "url"' }, 400);
    }
    if ((body as { url: string }).url.length > MAX_URL_LENGTH) {
      return jsonResponse({ error: "URL is too long" }, 400);
    }

    const note = (body as { note?: unknown }).note;
    if (note !== undefined && typeof note !== "string") {
      return jsonResponse({ error: '"note" must be a string when provided' }, 400);
    }
    if (typeof note === "string" && note.length > MAX_REPORT_NOTE_LENGTH) {
      return jsonResponse({ error: "Report note is too long" }, 400);
    }

    try {
      const result = await ctx.runMutation(api.checkUrl.submitReport, {
        url: (body as { url: string }).url,
        note,
        source: "web",
      });
      return jsonResponse(result, 202);
    } catch (error) {
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : "Failed to submit report",
        },
        400,
      );
    }
  }),
});

http.route({
  path: "/maintainer/domains",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: maintainerHeaders,
    });
  }),
});

http.route({
  path: "/maintainer/domains",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }

    if (typeof body !== "object" || body === null) {
      return jsonResponse({ error: "Request body must be an object" }, 400);
    }

    const token = readBearerToken(request);
    if (!isMaintainerTokenValid(token)) {
      return jsonResponse({ error: "Unauthorized" }, 401, maintainerHeaders);
    }

    const payload = body as {
      domain?: unknown;
      status?: unknown;
      reason?: unknown;
      source?: unknown;
      manuallyReviewed?: unknown;
    };

    if (
      typeof payload.domain !== "string" ||
      typeof payload.reason !== "string" ||
      typeof payload.source !== "string" ||
      (payload.status !== "verified" &&
        payload.status !== "watchlist" &&
        payload.status !== "blocked")
    ) {
      return jsonResponse(
        {
          error:
            'Request JSON must include domain, status, reason, and source strings',
        },
        400,
        maintainerHeaders,
      );
    }

    if (
      payload.manuallyReviewed !== undefined &&
      typeof payload.manuallyReviewed !== "boolean"
    ) {
      return jsonResponse(
        { error: '"manuallyReviewed" must be a boolean when provided' },
        400,
        maintainerHeaders,
      );
    }

    try {
      const result = await ctx.runMutation(internal.checkUrl.upsertDomainRecord, {
        domain: payload.domain,
        status: payload.status,
        reason: payload.reason,
        source: payload.source,
        manuallyReviewed: payload.manuallyReviewed,
      });
      return jsonResponse(result, 200, maintainerHeaders);
    } catch (error) {
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : "Failed to update domain",
        },
        403,
        maintainerHeaders,
      );
    }
  }),
});

http.route({
  path: "/check-url",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      await assertHttpRateLimit(
        ctx,
        request,
        "check-url",
        MAX_CHECK_REQUESTS_PER_MINUTE,
        60 * 1000,
      );
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Too many requests" },
        429,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, 400);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as { url?: unknown }).url !== "string"
    ) {
      return jsonResponse({ error: 'Request JSON must include a string "url"' }, 400);
    }
    if ((body as { url: string }).url.length > MAX_URL_LENGTH) {
      return jsonResponse({ error: "URL is too long" }, 400);
    }

    try {
      const result = await ctx.runAction(api.checkUrl.checkUrl, {
        url: (body as { url: string }).url,
      });
      return jsonResponse(result, 200);
    } catch (error) {
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : "Failed to check URL",
        },
        400,
      );
    }
  }),
});

function jsonResponse(
  body: unknown,
  status: number,
  headers = corsHeaders,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "content-type": "application/json",
    },
  });
}

async function assertHttpRateLimit(
  ctx: any,
  request: Request,
  route: string,
  maxRequests: number,
  windowMs: number,
): Promise<void> {
  await ctx.runMutation(internal.checkUrl.assertRateLimit, {
    key: getClientKey(request),
    route,
    maxRequests,
    windowMs,
    now: Date.now(),
  });
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor !== null && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("cf-connecting-ip") ?? "unknown-client";
}

function readBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (authorization === null || !authorization.startsWith("Bearer ")) {
    return "";
  }
  return authorization.slice("Bearer ".length).trim();
}

function isMaintainerTokenValid(token: string): boolean {
  const configuredToken = process.env.PHISHBUDDY_MAINTAINER_TOKEN;
  return (
    configuredToken !== undefined &&
    configuredToken.length >= 16 &&
    token.length === configuredToken.length &&
    token === configuredToken
  );
}

export default http;
