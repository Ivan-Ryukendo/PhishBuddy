export type ProviderStatus =
  | "clean"
  | "suspicious"
  | "dangerous"
  | "skipped"
  | "rate_limited"
  | "error";

export type ProviderSignal = {
  provider: "googleSafeBrowsing" | "virusTotal";
  status: ProviderStatus;
  reasons: string[];
  raw?: unknown;
};

type FetchLike = typeof fetch;

export async function checkGoogleSafeBrowsing(
  url: string,
  apiKey = getEnv("GOOGLE_SAFE_BROWSING_API_KEY"),
  fetchImpl: FetchLike = fetch,
): Promise<ProviderSignal> {
  if (!apiKey) {
    return skipped("googleSafeBrowsing", "Google Safe Browsing API key is not configured");
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;
  const body = {
    client: {
      clientId: "phishbuddy",
      clientVersion: "0.1.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      return rateLimited("googleSafeBrowsing");
    }

    if (!response.ok) {
      return providerError("googleSafeBrowsing", `Google Safe Browsing returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    if (matches.length > 0) {
      return {
        provider: "googleSafeBrowsing",
        status: "dangerous",
        reasons: matches.map((match: { threatType?: string }) =>
          `Google Safe Browsing matched ${match.threatType ?? "a threat"}`,
        ),
        raw: data,
      };
    }

    return {
      provider: "googleSafeBrowsing",
      status: "clean",
      reasons: [],
      raw: data,
    };
  } catch (error) {
    return providerError("googleSafeBrowsing", errorMessage(error));
  }
}

export async function checkVirusTotal(
  url: string,
  apiKey = getEnv("VIRUSTOTAL_API_KEY"),
  fetchImpl: FetchLike = fetch,
): Promise<ProviderSignal> {
  if (!apiKey) {
    return skipped("virusTotal", "VirusTotal API key is not configured");
  }

  try {
    const submitResponse = await fetchImpl("https://www.virustotal.com/api/v3/urls", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-apikey": apiKey,
      },
      body: new URLSearchParams({ url }).toString(),
    });

    if (submitResponse.status === 429) {
      return rateLimited("virusTotal");
    }

    if (!submitResponse.ok) {
      return providerError("virusTotal", `VirusTotal submit returned HTTP ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const analysisUrl = submitData?.data?.links?.self;
    if (typeof analysisUrl !== "string") {
      return providerError("virusTotal", "VirusTotal did not return an analysis URL");
    }

    const analysisResponse = await fetchImpl(analysisUrl, {
      headers: { "x-apikey": apiKey },
    });

    if (analysisResponse.status === 429) {
      return rateLimited("virusTotal");
    }

    if (!analysisResponse.ok) {
      return providerError("virusTotal", `VirusTotal analysis returned HTTP ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const stats = analysisData?.data?.attributes?.stats ?? {};
    const malicious = Number(stats.malicious ?? 0);
    const suspicious = Number(stats.suspicious ?? 0);

    if (malicious > 0) {
      return {
        provider: "virusTotal",
        status: "dangerous",
        reasons: [`VirusTotal reported ${malicious} malicious engine result(s)`],
        raw: analysisData,
      };
    }

    if (suspicious > 0) {
      return {
        provider: "virusTotal",
        status: "suspicious",
        reasons: [`VirusTotal reported ${suspicious} suspicious engine result(s)`],
        raw: analysisData,
      };
    }

    return {
      provider: "virusTotal",
      status: "clean",
      reasons: [],
      raw: analysisData,
    };
  } catch (error) {
    return providerError("virusTotal", errorMessage(error));
  }
}

function getEnv(name: string): string | undefined {
  const runtime = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name];
}

function skipped(
  provider: ProviderSignal["provider"],
  reason: string,
): ProviderSignal {
  return { provider, status: "skipped", reasons: [reason] };
}

function rateLimited(provider: ProviderSignal["provider"]): ProviderSignal {
  return { provider, status: "rate_limited", reasons: [`${provider} rate limit reached`] };
}

function providerError(
  provider: ProviderSignal["provider"],
  reason: string,
): ProviderSignal {
  return { provider, status: "error", reasons: [reason] };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Provider request failed";
}
