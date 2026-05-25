import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
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
  path: "/check-url",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
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

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}

export default http;
